.PHONY: build ci fmt fmt-check lint test

build:
	@deno run -A --unstable --reload mod.ts

ci:
	@make fmt-check
	@make lint
	@make build
	@make test

fmt:
	@deno fmt

fmt-check:
	@deno fmt --check

lint:
	@deno lint --unstable

test:
	@deno test -A --unstable --allow-none ./
