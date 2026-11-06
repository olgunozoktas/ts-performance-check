import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { main } from "../src/cli.js";

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const sink = () => { const s = { text: "", write: (t) => { s.text += t; } }; return s; };
const cli = async (...argv) => { const out = sink(), err = sink(); return { code: await main(argv, out, err), out: out.text }; };

test("the gate: medium fails at the default, passes with --fail-on high", async () => {
  assert.equal((await cli(path.join(FIX, "cli"))).code, 1);
  assert.equal((await cli("--fail-on", "high", path.join(FIX, "cli"))).code, 0);
  assert.equal((await cli("--only", "json-deep-clone", "--fail-on", "medium", path.join(FIX, "cli"))).code, 0);
});

test("--json counts, and a wrong use exits 2", async () => {
  const j = JSON.parse((await cli("--json", path.join(FIX, "cli"))).out);
  assert.deepEqual([j.counts.medium, j.counts.low], [1, 1]);
  assert.equal((await cli("--fail-on", "x", path.join(FIX, "cli"))).code, 2);
  assert.equal((await cli(path.join(FIX, "marker"))).code, 2);
});
