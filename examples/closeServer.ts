// deno run --allow-net --unstable ./examples/closeServer.ts

import { serve } from "../mod.ts";

const server = serve(4505);

console.log("Listening on port 4505.");

for await (const requestEvent of server) {
  console.log(`${requestEvent.method}: ${requestEvent.url}`);

  if (requestEvent.url.endsWith("/close")) {
    console.log("Closing server.");

    break;
  }

  const body = `Your user-agent is:\n\n${requestEvent.request.headers.get(
    "user-agent",
  ) ?? "Unknown"}`;

  requestEvent.respondWith(new Response(body, { status: 200 }));
}

server.close();

console.log("Finished.");
