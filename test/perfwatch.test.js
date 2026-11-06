import { test } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { perfwatch, percentile, routeOf } from "../src/perfwatch.js";

// A clock and a request that the test moves by hand: no server, no port, no timer.
function rig(opts = {}) {
  let t = 0;
  const warned = [];
  const w = perfwatch({ loop: false, now: () => t, logger: { warn: (m) => warned.push(m) }, ...opts });
  const hit = (req, ms) => { const res = new EventEmitter(); w.middleware(req, res, () => {}); t += ms; res.emit("finish"); };
  return { w, hit, warned };
}

test("percentiles by nearest rank", () => {
  const xs = Array.from({ length: 100 }, (_, i) => i + 1);
  assert.deepEqual([50, 95, 99, 100].map((p) => percentile(xs, p)), [50, 95, 99, 100]);
  assert.equal(percentile([], 50), 0);
});

test("a route is named by its pattern, not by its path", () => {
  assert.equal(routeOf({ method: "GET", baseUrl: "/api", route: { path: "/users/:id" } }), "GET /api/users/:id");
  assert.equal(routeOf({ method: "GET", url: "/random/123" }), "GET unmatched");
  const { w, hit } = rig();
  hit({ method: "GET", route: { path: "/users/:id" } }, 5);
  hit({ method: "GET", route: { path: "/users/:id" } }, 7);
  assert.deepEqual(Object.keys(w.stats().routes), ["GET /users/:id"]);
  assert.equal(w.stats().routes["GET /users/:id"].count, 2);
});

test("slow requests are counted and logged", () => {
  const { w, hit, warned } = rig({ slow: 100 });
  hit({ method: "POST", route: { path: "/a" } }, 150);
  hit({ method: "POST", route: { path: "/a" } }, 10);
  assert.equal(w.stats().routes["POST /a"].slow, 1);
  assert.equal(warned.length, 1);
  assert.equal(w.stats().routes["POST /a"].max, 150);
});

test("the ring keeps the newest samples only", () => {
  const { w, hit } = rig({ samples: 4 });
  for (const ms of [1000, 1000, 1000, 1000, 1, 1, 1, 1]) hit({ method: "GET", route: { path: "/r" } }, ms);
  const r = w.stats().routes["GET /r"];
  assert.deepEqual([r.count, r.p99, r.max], [8, 1, 1000]);
});

test("the handler answers JSON that is never cached", () => {
  const { w, hit } = rig();
  hit({ method: "GET", route: { path: "/x" } }, 3);
  const headers = {}; let body = "";
  w.handler({}, { setHeader: (k, v) => { headers[k] = v; }, end: (b) => { body = b; } });
  assert.equal(headers["Cache-Control"], "no-store");
  assert.equal(JSON.parse(body).routes["GET /x"].p50, 3);
});

test("the event-loop delay is measured when it is on", () => {
  const w = perfwatch({ logger: null });
  const s = w.stats();
  w.stop();
  assert.ok(s.event_loop_ms && typeof s.event_loop_ms.p99 === "number");
});
