# Examples

## serve

Starts a server on port `4505` using the the `serve` method.

```console
deno run --allow-net --unstable ./examples/serve.ts
```

## listenAndServe

Starts a server on port `4505` using the the `listenAndServe` method.

```console
deno run --allow-net --unstable ./examples/listenAndServe.ts
```

## closeServer

Start a server on port `4505` using the `serve` method.

Requests ending in `/close` will cause the server to gracefully close.

```console
deno run --allow-net --unstable ./examples/closeServer.ts
```

## serveTls

Start a TLS server on port `4505` using the `serve` method.

Note that you will need to trust the test RootCA in the `test/tls` directory for browsers to not block your requests.

```console
deno run --allow-net --allow-read --unstable ./examples/serveTls.ts
```
