# native_http

<a href="https://github.com/cmorten/native_http/tags/"><img src="https://img.shields.io/github/tag/cmorten/native_http" alt="Current version" /></a>
<img src="https://github.com/cmorten/native_http/workflows/Test/badge.svg" alt="Current test status" />
<a href="http://makeapullrequest.com"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs are welcome" /></a>
<a href="https://github.com/cmorten/native_http/issues/"><img src="https://img.shields.io/github/issues/cmorten/native_http" alt="native_http issues" /></a>
<img src="https://img.shields.io/github/stars/cmorten/native_http" alt="native_http stars" />
<img src="https://img.shields.io/github/forks/cmorten/native_http" alt="native_http forks" />
<img src="https://img.shields.io/github/license/cmorten/native_http" alt="native_http license" />
<a href="https://github.com/cmorten/native_http/graphs/commit-activity"><img src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" alt="native_http is maintained" /></a>
<a href="https://github.com/denoland/deno/blob/main/Releases.md"><img src="https://img.shields.io/badge/deno-^1.11.5-brightgreen?logo=deno" alt="Minimum supported Deno version" /></a>

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
[Deno docs](https://doc.deno.land/https/deno.land/x/native_http/mod.ts).

## Examples

Please refer to the [examples documentation](./examples).

## Contributing

Please refer to the [contributing guide](./.github/CONTRIBUTING.md).

---

## License

`native_http` is licensed under the [MIT License](./LICENSE.md).
