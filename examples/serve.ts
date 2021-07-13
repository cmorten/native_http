// deno run --allow-net --unstable ./examples/serve.ts

import { serve } from "../mod.ts";

const server = serve(4505);

console.log("Listening on port 4505.");

for await (const requestEvent of server) {
  const body = `Your user-agent is:\n\n${requestEvent.request.headers.get(
    "user-agent",
  ) ?? "Unknown"}`;

  requestEvent.respondWith(new Response(body, { status: 200 }));
}
