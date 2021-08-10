# Examples

## serve

Starts a server on port `4505` using the the `serve` method.

```console
deno run --allow-net ./examples/serve.ts
```

## listenAndServe

Starts a server on port `4505` using the the `listenAndServe` method.

```console
deno run --allow-net ./examples/listenAndServe.ts
```

## closeServer

Start a server on port `4505` using the `serve` method.

Requests ending in `/close` will cause the server to gracefully close.

```console
deno run --allow-net ./examples/closeServer.ts
```

## serveTls

Start a TLS server on port `4505` using the `serve` method.

Note that you will need to trust the test RootCA in the `test/tls` directory for
browsers to not block your requests.

The `--unstable` flag is required for the unstable
`Deno.listenTls#alpn_protocols` API.

```console
deno run --allow-net --allow-read --unstable ./examples/serveTls.ts
```
