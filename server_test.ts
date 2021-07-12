import {
  equal,
  unreachable,
} from "https://deno.land/std@0.100.0/testing/asserts.ts";
import { superdeno } from "https://deno.land/x/superdeno@4.3.0/mod.ts";
import { serve, Server, ServerRequest } from "./server.ts";
import { it } from "./_utils.ts";

class MockRequestEvent implements Deno.RequestEvent {
  calls: Response[] = [];
  request: Request;

  constructor(input: RequestInfo, init?: RequestInit) {
    this.request = new Request(input, init);
  }

  async respondWith(response: Response | Promise<Response>): Promise<void> {
    this.calls.push(await response);

    return Promise.resolve();
  }
}

class MockConn implements Deno.Conn {
  get localAddr(): Deno.NetAddr {
    return {
      transport: "tcp",
      hostname: "0.0.0.0",
      port: 4505,
    };
  }

  get remoteAddr(): Deno.NetAddr {
    return {
      transport: "tcp",
      hostname: "0.0.0.0",
      port: 6340,
    };
  }

  get rid(): number {
    return 4505;
  }

  read(_p: Uint8Array): Promise<number | null> {
    return Promise.resolve(null);
  }

  write(_p: Uint8Array): Promise<number> {
    return Promise.resolve(0);
  }

  closeWrite(): Promise<void> {
    return Promise.resolve();
  }

  close(): void {}
}

class MockListener implements Deno.Listener {
  closed = false;

  constructor(public conn: Deno.Conn) {}

  get addr(): Deno.Addr {
    return this.conn.localAddr;
  }

  get rid(): number {
    return 4505;
  }

  accept(): Promise<Deno.Conn> {
    return Promise.resolve(this.conn);
  }

  close(): void {
    this.closed = true;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<Deno.Conn> {
    while (true) {
      if (this.closed) {
        break;
      }

      yield this.conn;
    }
  }
}

const mockRequestEvent = new MockRequestEvent("http://0.0.0.0:4505");
const mockResponse = new Response("test-response", { status: 200 });
const mockConn = new MockConn();

it("ServerRequest should expose the underlying Request through a getter", async () => {
  const request = new ServerRequest(mockRequestEvent);

  equal(request.request, mockRequestEvent.request);

  await request.respondWith(new Response());
  await request.done;
});

it("ServerRequest should expose the underlying Request url through a getter", async () => {
  const request = new ServerRequest(mockRequestEvent);

  equal(request.url, mockRequestEvent.request.url);

  await request.respondWith(new Response());
  await request.done;
});

it("ServerRequest should expose the underlying Request method through a getter", async () => {
  const request = new ServerRequest(mockRequestEvent);

  equal(request.method, mockRequestEvent.request.method);

  await request.respondWith(new Response());
  await request.done;
});

it("ServerRequest should expose the underlying Request headers through a getter", async () => {
  const request = new ServerRequest(mockRequestEvent);

  equal(request.headers, mockRequestEvent.request.headers);

  await request.respondWith(new Response());
  await request.done;
});

it("ServerRequest should expose a done promise getter which resolves when the response has been sent", async () => {
  const request = new ServerRequest(mockRequestEvent);
  let done = false;
  request.done.then(() => done = true);
  await new Promise((resolve) => setTimeout(resolve, 100));

  equal(done, false);
  await request.respondWith(new Response());
  equal(done, true);
});

it("ServerRequest should delegate the responding to the underlying requestEvent", async () => {
  const request = new ServerRequest(mockRequestEvent);
  await request.respondWith(mockResponse);

  equal(mockRequestEvent.calls[0], mockResponse);

  await request.done;
});

it("ServerRequest should throw a TypeError if the response has already been sent", async () => {
  const request = new ServerRequest(mockRequestEvent);
  await request.respondWith(mockResponse);

  try {
    await request.respondWith(mockResponse);

    unreachable();
  } catch (error) {
    equal(error, new TypeError("Response already sent"));
  }

  await request.done;
});

it("Server should expose the underlying listener", () => {
  const mockListener = new MockListener(mockConn);
  const server = new Server(mockListener);

  equal(server.listener, mockListener);
});

it("Server should close the underlying listener on close", () => {
  const mockListener = new MockListener(mockConn);
  const server = new Server(mockListener);

  server.close();

  equal(mockListener.closed, true);
});

// it("serve should return a new Server on port 80 when no options are provided", () => {
//   const expectedPort = 80;
//   const server = serve();

//   equal(server instanceof Server, true);

//   const address = server.listener.addr as Deno.NetAddr;

//   equal(address.port, expectedPort);

//   server.close();
// });

// it("serve should return a new Server on port 80 when null is provided", () => {
//   const expectedPort = 80;
//   const server = serve(null);

//   equal(server instanceof Server, true);

//   const address = server.listener.addr as Deno.NetAddr;

//   equal(address.port, expectedPort);

//   server.close();
// });

it("serve should return a new Server on the provided port", () => {
  const expectedPort = 4505;
  const server = serve(expectedPort);

  equal(server instanceof Server, true);

  const address = server.listener.addr as Deno.NetAddr;

  equal(address.port, expectedPort);

  server.close();
});

it("serve should return a new Server on the provided string port", () => {
  const expectedPort = 4505;
  const expectedHostname = "0.0.0.0";

  const server = serve(`:${expectedPort}`);

  equal(server instanceof Server, true);

  const address = server.listener.addr as Deno.NetAddr;

  equal(address.port, expectedPort);
  equal(address.hostname, expectedHostname);

  server.close();
});

// it("serve should return a new Server on the provided string hostname", () => {
//   const expectedPort = 80;
//   const expectedHostname = "0.0.0.0";

//   const server = serve(expectedHostname);

//   equal(server instanceof Server, true);

//   const address = server.listener.addr as Deno.NetAddr;

//   equal(address.port, expectedPort);
//   equal(address.hostname, expectedHostname);

//   server.close();
// });

it("serve should return a new Server on the provided string hostname", () => {
  const expectedPort = 4505;
  const expectedHostname = "0.0.0.0";

  const server = serve(`${expectedHostname}:${expectedPort}`);

  equal(server instanceof Server, true);

  const address = server.listener.addr as Deno.NetAddr;

  equal(address.port, expectedPort);
  equal(address.hostname, expectedHostname);

  server.close();
});

it("serve should return a new Server on the provided HTTP options object", () => {
  const expectedPort = 4505;
  const expectedHostname = "0.0.0.0";

  const server = serve({ port: expectedPort, hostname: expectedHostname });

  equal(server instanceof Server, true);

  const address = server.listener.addr as Deno.NetAddr;

  equal(address.port, expectedPort);
  equal(address.hostname, expectedHostname);

  server.close();
});

["get", "post", "put", "delete", "patch"].forEach(
  (method) => {
    it(`serve should return a new Server capable of handling ${method} requests and gracefully closing afterwards`, (
      done,
    ) => {
      const expectedStatus = 418;

      const server = serve(4505);
      const address = server.listener.addr as Deno.NetAddr;
      const url = `http://localhost:${address.port}`;

      (async () => {
        for await (const requestEvent of server) {
          const response = new Response(
            `${requestEvent.method}: ${requestEvent.url}`,
            {
              status: expectedStatus,
            },
          );

          await requestEvent.respondWith(response);
        }
      })();

      // deno-lint-ignore no-explicit-any
      (superdeno(url) as any)[method]("/")
        .expect(`${method.toUpperCase()}: ${url}/`)
        .expect(expectedStatus)
        .end((err: Error) => {
          server.close();

          done(err);
        });
    });
  },
);
