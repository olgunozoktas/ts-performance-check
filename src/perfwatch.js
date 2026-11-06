// perfwatch: what a running Node service spends its time on, without an agent or a vendor.
//   const watch = perfwatch({ slow: 500 });
//   app.use(watch.middleware);                  // Express, Connect, or node:http: (req, res, next)
//   app.get("/debug/perf", watch.handler);      // JSON: each route's p50, p95, p99, max, count and slow count, and the event loop
// Each route keeps its newest `samples` durations (default 1024). The event-loop delay comes from perf_hooks
// (monitorEventLoopDelay): a high p99 there means that synchronous work blocks every request.
import { monitorEventLoopDelay, performance } from "node:perf_hooks";

/** The value at a rank (nearest rank) of a sorted list. */
export function percentile(sorted, p) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
}

/** The route's name: Express's route pattern (req.baseUrl + req.route.path) after routing, else "unmatched", so
 *  /users/1 and /users/2 are one route and a scan of random paths makes one row, not thousands. */
export function routeOf(req) {
  if (req.route?.path !== undefined) return `${req.method} ${(req.baseUrl ?? "") + String(req.route.path)}`;
  if (req.routeOptions?.url) return `${req.method} ${req.routeOptions.url}`; // Fastify
  return `${req.method} unmatched`;
}

export function perfwatch({ slow = 500, samples = 1024, logger = console, now = () => performance.now(), loop = true } = {}) {
  const routes = new Map();
  const delay = loop ? monitorEventLoopDelay({ resolution: 20 }) : null;
  delay?.enable();

  function observe(name, ms) {
    let r = routes.get(name);
    if (!r) routes.set(name, (r = { ring: [], next: 0, count: 0, slow: 0, max: 0 }));
    if (r.ring.length < samples) r.ring.push(ms); else { r.ring[r.next] = ms; r.next = (r.next + 1) % samples; }
    r.count++;
    r.max = Math.max(r.max, ms);
    if (ms >= slow) { r.slow++; logger?.warn?.(`perfwatch: slow request ${name} ${ms.toFixed(1)} ms`); }
  }

  function middleware(req, res, next) {
    const start = now();
    res.once("finish", () => observe(routeOf(req), now() - start));
    next?.();
  }

  function stats() {
    const out = {};
    for (const [name, r] of [...routes].sort(([a], [b]) => a.localeCompare(b))) {
      const sorted = [...r.ring].sort((a, b) => a - b);
      out[name] = { count: r.count, slow: r.slow, p50: percentile(sorted, 50), p95: percentile(sorted, 95), p99: percentile(sorted, 99), max: r.max };
    }
    const event_loop = delay ? { p50: delay.percentile(50) / 1e6, p99: delay.percentile(99) / 1e6, max: delay.max / 1e6 } : null;
    return { routes: out, event_loop_ms: event_loop };
  }

  function handler(_req, res) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(stats()));
  }

  return { middleware, observe, stats, handler, stop: () => delay?.disable() };
}
