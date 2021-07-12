import { serve } from "../server.ts";

const address = Deno.args[0] || "127.0.0.1:4505";
const server = serve(address);
const body = new TextEncoder().encode("Hello Deno!");

console.log(`http://${address}/`);

for await (const requestEvent of server) {
  const res = new Response(
    body,
    { headers: new Headers() },
  );
  res.headers.set("Date", new Date().toUTCString());
  res.headers.set("Connection", "keep-alive");

  requestEvent.respondWith(res).catch(() => {});
}
