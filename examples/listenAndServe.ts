// deno run --allow-net --unstable ./examples/listenAndServe.ts

import { listenAndServe } from "../mod.ts";

listenAndServe(4505, (requestEvent) => {
  const body = `Your user-agent is:\n\n${requestEvent.request.headers.get(
    "user-agent",
  ) ?? "Unknown"}`;

  requestEvent.respondWith(new Response(body, { status: 200 }));
});

console.log("Listening on port 4505.");
