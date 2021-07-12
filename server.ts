import { MuxAsyncIterator } from "https://deno.land/std@0.100.0/async/mod.ts";
import { HttpConn, RequestEvent } from "./deno_types.ts";

export type HTTPOptions = Omit<Deno.ListenOptions, "transport">;
export type HTTPSOptions = Omit<Deno.ListenTlsOptions, "transport">;

const ERROR_INVALID_ADDRESS = "Invalid address";
const ERROR_ALREADY_RESPONDED = "Response already sent";
const ERROR_NEED_UNSTABLE_FLAG = "`--unstable` flag is required";

const serveHttp: (conn: Deno.Conn) => HttpConn = "serveHttp" in Deno
  ? // deno-lint-ignore no-explicit-any
    (Deno as any).serveHttp.bind(Deno)
  : undefined;

export class ServerRequest implements RequestEvent {
  #request: Request;
  #resolver!: (value: Response | Promise<Response>) => void;
  #responsePromise: Promise<void>;
  #done = false;

  /**
   * Constructs a new ServerRequest instance.
   *
   * @param {RequestEvent} requestEvent
   */
  constructor(requestEvent: RequestEvent) {
    this.#request = requestEvent.request;

    const wrappedResponse = new Promise<Response>((resolve) => {
      this.#resolver = resolve;
    });

    this.#responsePromise = requestEvent.respondWith(wrappedResponse);
  }

  /**
   * Get the Request instance.
   */
  get request(): Request {
    return this.#request;
  }

  /**
   * Get the Request URL.
   */
  get url(): string {
    return this.#request.url;
  }

  /**
   * Get the Request method.
   */
  get method(): string {
    return this.#request.method;
  }

  /**
   * Get the Request headers.
   */
  get headers(): Headers {
    return this.#request.headers;
  }

  /**
   * Determine whether the response has completed.
   */
  get done(): Promise<void> {
    return this.#responsePromise;
  }

  /**
   * Send a response to the request.
   *
   * @param {Response|Promise<Response>} response
   * @return {Promise<void>}
   *
   * @throws {Deno.errors.BadResource} When the response has already been sent.
   */
  respondWith(response: Response | Promise<Response>): Promise<void> {
    if (this.#done) {
      throw new Deno.errors.BadResource(ERROR_ALREADY_RESPONDED);
    }

    this.#resolver(response);
    this.#done = true;

    return this.#responsePromise;
  }
}

export class Server implements AsyncIterable<ServerRequest> {
  #closing = false;
  #httpConnections: HttpConn[] = [];

  /**
   * Creates a new Server instance.
   *
   * @param {Deno.Listener} listener
   */
  constructor(public listener: Deno.Listener) {}

  /**
   * Close the server and any associated http connections.
   */
  close(): void {
    this.#closing = true;
    this.listener.close();

    for (const httpConn of this.#httpConnections) {
      try {
        httpConn.close();
      } catch (error) {
        if (!(error instanceof Deno.errors.BadResource)) {
          throw error;
        }
      }
    }

    this.#httpConnections = [];
  }

  /**
   * Yields all HTTP requests on a single TCP connection.
   *
   * @param {HttpConn} httpConn The HTTP connection to yield requests from.
   *
   * @yields {ServerRequest} HTTP request events
   *
   * @private
   */
  private async *iterateHttpRequests(
    httpConn: HttpConn,
  ): AsyncIterableIterator<ServerRequest> {
    while (!this.#closing) {
      // Yield the new HTTP request on the connection.
      const requestEvent = await httpConn.nextRequest();

      if (requestEvent === null) {
        break;
      }

      // Wrap request event so can gracefully handle and await async ops.
      const serverRequest = new ServerRequest(requestEvent);

      // Consumer can handle the request event.
      yield serverRequest;

      // Wait for the request to be processed before we accept a new request on
      // this connection.
      await serverRequest.done;
    }

    this.untrackConnection(httpConn);

    try {
      httpConn.close();
    } catch (error) {
      if (!(error instanceof Deno.errors.BadResource)) {
        throw error;
      }
    }
  }

  /**
   * Accepts a new TCP connection and yields all HTTP requests that arrive on
   * it. When a connection is accepted, it also creates a new iterator of the
   * same kind and adds it to the request multiplexer so that another TCP
   * connection can be accepted.
   *
   * @param {MuxAsyncIterator<ServerRequest>} mux
   *
   * @yields {ServerRequest}
   *
   * @private
   */
  private async *acceptConnAndIterateHttpRequests(
    mux: MuxAsyncIterator<ServerRequest>,
  ): AsyncIterableIterator<ServerRequest> {
    if (this.#closing) {
      return;
    }

    // Wait for a new connection.
    let conn: Deno.Conn;

    try {
      conn = await this.listener.accept();
    } catch (error) {
      if (
        // The listener is closed
        error instanceof Deno.errors.BadResource ||
        // TLS handshake errors
        error instanceof Deno.errors.InvalidData ||
        error instanceof Deno.errors.UnexpectedEof ||
        error instanceof Deno.errors.ConnectionReset
      ) {
        return mux.add(this.acceptConnAndIterateHttpRequests(mux));
      }

      throw error;
    }

    // "Upgrade" the network connection into a HTTP connection
    const httpConn = serveHttp(conn);

    // Closing the underlying server will not close the HTTP connection,
    // so we track it for closure upon shutdown.
    this.trackConnection(httpConn);

    // Try to accept another connection and add it to the multiplexer.
    mux.add(this.acceptConnAndIterateHttpRequests(mux));

    // Yield the requests that arrive on the just-accepted connection.
    yield* this.iterateHttpRequests(httpConn);
  }

  /**
   * Adds the HTTP connection to the internal tracking list.
   *
   * @param {HttpConn} httpConn
   *
   * @private
   */
  private trackConnection(httpConn: HttpConn): void {
    this.#httpConnections.push(httpConn);
  }

  /**
   * Removes the HTTP connection from the internal tracking list.
   *
   * @param {HttpConn} httpConn
   * @private
   */
  private untrackConnection(httpConn: HttpConn): void {
    const index = this.#httpConnections.indexOf(httpConn);

    if (index !== -1) {
      this.#httpConnections.splice(index, 1);
    }
  }

  /**
   * Implementation of Async Iterator to allow consumers to loop over
   * HTTP requests.
   *
   * @return {AsyncIterableIterator<ServerRequest>} The async iterator.
   */
  [Symbol.asyncIterator](): AsyncIterableIterator<ServerRequest> {
    const mux: MuxAsyncIterator<ServerRequest> = new MuxAsyncIterator();
    mux.add(this.acceptConnAndIterateHttpRequests(mux));

    return mux.iterate();
  }
}

/**
 * Creates an address object from a string.
 *
 * @param {string} address The address string to parse.
 * @return {HTTPOptions} The parsed address object.
 *
 * @throws {TypeError} When an invalid address string is provided.
 *
 * @private
 */
function parseAddressFromString(address: string): HTTPOptions {
  let url: URL;

  const host = address.startsWith(":") ? `0.0.0.0${address}` : address;

  try {
    url = new URL(`http://${host}`);
  } catch {
    throw new TypeError(ERROR_INVALID_ADDRESS);
  }

  if (
    url.username ||
    url.password ||
    url.pathname != "/" ||
    url.search ||
    url.hash
  ) {
    throw new TypeError(ERROR_INVALID_ADDRESS);
  }

  return {
    hostname: url.hostname,
    port: url.port === "" ? 80 : Number(url.port),
  };
}

/**
 * Determines if the provided options are for a TLS listener.
 *
 * @param {*} listenOptions The options to interrogate.
 * @return {boolean} Whether the provided options are for a TLS listener.
 *
 * @private
 */
function isListenTlsOptions(
  listenOptions: unknown,
): listenOptions is Deno.ListenTlsOptions {
  return typeof listenOptions === "object" && listenOptions !== null &&
    "certFile" in listenOptions && "keyFile" in listenOptions;
}

/**
 * Creates a new HTTP Server on the provided address.
 *
 * @param {null|number|string|HTTPOptions|HTTPSOptions} [address] The address for the server to listen on.
 * @return {Server} A server instance listening on the provided address.
 *
 * @throws {Error} When the `--unstable` flag has not be set.
 *
 * @example
 *
 * ```ts
 * import { serve } from "https://deno.land/x/native_http/mod.ts";
 *
 * const server = serve(4505);
 *
 * for await (const requestEvent of server) {
 *   const body = `Your user-agent is:\n\n${requestEvent.request.headers.get(
 *     "user-agent",
 *   ) ?? "Unknown"}`;
 *
 *   requestEvent.respondWith(new Response(body, { status: 200 }));
 * }
 * ```
 */
export function serve(
  address?: null | number | string | HTTPOptions | HTTPSOptions,
): Server {
  if (!serveHttp) {
    throw new Error(ERROR_NEED_UNSTABLE_FLAG);
  }

  let listenOptions;

  if (typeof address === "undefined" || address === null) {
    listenOptions = { port: 80 };
  } else if (typeof address === "number") {
    listenOptions = { port: address };
  } else if (typeof address === "string") {
    listenOptions = parseAddressFromString(address);
  } else {
    listenOptions = address;
  }

  const listener = isListenTlsOptions(listenOptions)
    ? Deno.listenTls(listenOptions)
    : Deno.listen(listenOptions);

  return new Server(listener);
}

/**
 * Creates and starts a new HTTP Server on the provided address.
 * Requests are passed to the provided handler.
 *
 * @param {undefined|null|number|string|HTTPOptions|HTTPSOptions} address The address for the server to listen on.
 * @param {Function} handler A handler for incoming HTTP requests.
 * @example
 *
 * ```ts
 * import { listenAndServe } from "https://deno.land/x/native_http/mod.ts";
 *
 * listenAndServe(4505, (requestEvent) => {
 *   const body = `Your user-agent is:\n\n${requestEvent.request.headers.get(
 *     "user-agent",
 *   ) ?? "Unknown"}`;
 *
 *   requestEvent.respondWith(new Response(body, { status: 200 }));
 * });
 * ```
 */
export async function listenAndServe(
  address: undefined | null | number | string | HTTPOptions | HTTPSOptions,
  handler: (requestEvent: ServerRequest) => void,
): Promise<void> {
  const server = serve(address);

  for await (const requestEvent of server) {
    handler(requestEvent);
  }
}
