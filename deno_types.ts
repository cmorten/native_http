// Export all the unstable types used so users importing this library don't
// fail their typechecks when _not_ using `--unstable`.

export interface RequestEvent {
  readonly request: Request;
  respondWith(r: Response | Promise<Response>): Promise<void>;
}

export interface HttpConn extends AsyncIterable<RequestEvent> {
  readonly rid: number;

  nextRequest(): Promise<RequestEvent | null>;
  close(): void;
}
