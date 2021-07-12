# native_http

`native_http` is a module to provide native Deno HTTP client and server
implementations equivalent to those currently provided by the Deno
[http standard library](https://deno.land/std/http).

```ts
import { serve } from "https://deno.land/x/native_http/mod.ts";

const server = serve(4505);

console.log("Listening on port 4505.");

for await (const requestEvent of server) {
  requestEvent.respondWith(new Response("Hello World\n", { status: 200 }));
}
```

## Documentation

Please refer to the
[Deno docs](https://doc.deno.land/https/deno.land/x/native_server/mod.ts).

## Examples

Please refer to the [examples documentation](./examples).

## Contributing

Please refer to the [contributing guide](./.github/CONTRIBUTING.md).

---

## License

`native_server` is licensed under the [MIT License](./LICENSE.md).
