import { serve } from "../server.ts";

const address = Deno.args[0] || "localhost:4505";
const server = serve(address);

console.log("Server listening on", address);

const encoder = new TextEncoder();
const body = encoder.encode("Hello World");

for await (const requestEvent of server) {
  try {
    requestEvent.respondWith(new Response(body));
  } catch (_) {
    // Ignore.
  }
}
