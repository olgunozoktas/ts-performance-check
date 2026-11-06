# ts-performance-check

Performance help for **TypeScript and JavaScript** projects, **without AI**, in two parts:

1. **`ts-performance-check`**: static checks with the TypeScript compiler's parser (one file for each check). A finding
   at or above `--fail-on` exits 1. Use `--fail-on high` as a merge gate: a performance finding is a candidate,
   because the check sees a shape, not how often it runs.
2. **`perfwatch`**: a small library for a running Node service: each route's latency (p50, p95, p99, max), its count
   and its slow requests, and the event-loop delay.

## Install and run

```bash
npm i -D github:olgunozoktas/ts-performance-check      # from GitHub (npm publication comes later)
npx ts-performance-check                               # the project in this folder
npx ts-performance-check --fail-on high                # the merge gate
npx ts-performance-check --json --only await-in-loop,spread-in-reduce
```

Exit 0: nothing at or above `--fail-on` (default `medium`). Exit 1: a finding. Exit 2: a wrong flag, or a folder with
no `package.json`, `tsconfig.json` or `jsconfig.json`. The same folders and built files are skipped as in
[ts-security-check](https://github.com/olgunozoktas/ts-security-check), and `archive/` folders too.

## The checks

| Check | Severity | What it finds |
|---|---|---|
| `await-in-loop` | low | `await` in the body of a `for` loop over items: each iteration waits for the one before it. Not reported: `for await`, `while` and `do` loops (streams and polls), a loop that stops early (`break`, `return`, `throw`), one that sleeps or retries, and an `await` in the loop's head |
| `client-per-call` | medium | `new http(s).Agent`, `Pool`, `PrismaClient`, `Redis` or `axios.create()` inside a function on each call. Not reported: a module constant, a constructor, a factory (`create…`, `make…`, `init…`, `get…Client` …), and a value that is returned or stored |
| `heavy-import` | low | `import … from "lodash"` (the whole library) and `moment` |
| `json-deep-clone` | low | `JSON.parse(JSON.stringify(x))`: use `structuredClone` |
| `lookup-in-loop` | low | a join on a key inside a loop or an array callback: `other.find((o) => o.id === x.id)`. Build a `Map` once |
| `spread-in-reduce` | medium | `reduce` that copies its accumulator (`{ ...acc }`, `[...acc]`) on every step: n² copies |
| `sync-io-in-async` | medium | `fs` `…Sync`, `execSync`, `pbkdf2Sync`, zlib `…Sync` in a request handler (`(req, res)`), or in an async function of a server file (Express, Fastify, Koa, Hono, Next, Nest, `createServer`). A CLI or a build script is not reported |

A line that the author checked carries a marker in a real comment:
`// ts-performance-check:ignore <reason>` (or `// eslint-disable-line perf/…`).

## perfwatch

```js
import express from "express";
import { perfwatch } from "ts-performance-check/perfwatch";

const watch = perfwatch({ slow: 500 });          // ms; slow requests are logged with console.warn
const app = express();
app.use(watch.middleware);
app.get("/users/:id", showUser);
app.get("/debug/perf", requireAdmin, watch.handler);   // put it behind your own auth: it shows your routes
```

- A route is named by its pattern (`GET /users/:id`, Express's `req.baseUrl + req.route.path`, Fastify's
  `routeOptions.url`), so `/users/1` and `/users/2` are one route; a request that no route matched is `unmatched`.
- Each route keeps its newest `samples` durations (default 1024). `watch.observe(name, ms)` records a job too.
- `event_loop_ms` comes from `perf_hooks.monitorEventLoopDelay`: a high p99 means that synchronous work blocks every
  request (see `sync-io-in-async`).
- `watch.stop()` stops the event-loop monitor (tests, a graceful shutdown).

## Add a check

A file in `src/checks/` whose default export is `{ name, run(project) }`, a `test/fixtures/<check>/bad/` and `good/`
folder, and its line in `BAD` in `test/checks.test.js`.

## License

MIT
