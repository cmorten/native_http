// deno run --allow-net --allow-read --unstable ./examples/serveTls.ts
//
// Note that you will need to trust the RootCA before browsers will
// allow you to connect.

import { serve } from "../mod.ts";

const tlsOptions = {
  hostname: "localhost",
  port: 4505,
  certFile: new URL("../test/tls/localhost.crt", import.meta.url).pathname,
  keyFile: new URL("../test/tls/localhost.key", import.meta.url).pathname,
  alpnProtocols: ["h2", "http/1.1"],
};

const server = serve(tlsOptions);

console.log("Listening on port 4505.");

for await (const requestEvent of server) {
  const body = `Your user-agent is:\n\n${requestEvent.request.headers.get(
    "user-agent",
  ) ?? "Unknown"}`;

  requestEvent.respondWith(new Response(body, { status: 200 }));
}
