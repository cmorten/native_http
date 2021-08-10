#!/bin/bash
echo
deno run --allow-net --no-check --reload $1 'localhost:4505' &
pid=$!

while [[ "$(curl -s -o /dev/null -I -w '%{http_code}' 'http://localhost:4505/')" != "200" ]]; do
  sleep 5;
done

wrk 'http://localhost:4505/' -d '20s' --latency

kill $pid
