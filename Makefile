.PHONY: benchmark build ci fmt fmt-check lint test

benchmark:
	@echo "native_http benchmark"
	@echo "================================"
	@./benchmark/run.sh ./benchmark/bench.ts
	@echo ""
	@echo "std/http benchmark"
	@echo "================================"
	@./benchmark/run.sh https://deno.land/std/http/bench.ts
	@echo ""
	@echo "deno_http_native benchmark"
	@echo "================================"
	@./benchmark/run.sh https://raw.githubusercontent.com/denoland/deno/main/cli/bench/deno_http_native.js
	@echo ""

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
	@deno test -A --unstable --allow-none --doc ./
