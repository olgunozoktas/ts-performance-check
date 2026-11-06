// Each check finds exactly its bad shapes and is silent on the good ones; the shared rules hold. The fixtures are read in
// place: no test writes a file. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { load, checks, kept } from "../src/core.js";

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const all = await checks();
const byName = Object.fromEntries(all.map((c) => [c.name, c]));
const run = (name, folder) => { const p = load(path.join(FIX, folder)); return kept(p, byName[name].run(p)); };
const sev = (fs_) => fs_.map((f) => f.severity).sort().join(",");

const BAD = {
  "await-in-loop": "low,low",
  "sync-io-in-async": "medium,medium",
  "json-deep-clone": "low",
  "spread-in-reduce": "medium,medium",
  "lookup-in-loop": "low,low",
  "client-per-call": "medium,medium",
  "heavy-import": "low,low",
};

test("each check finds exactly its bad shapes", () => {
  for (const [name, want] of Object.entries(BAD)) assert.equal(sev(run(name, `${name}/bad`)), want, name);
});

test("each check is silent on its good shapes", () => {
  for (const name of Object.keys(BAD)) assert.deepEqual(run(name, `${name}/good`).map((f) => `${f.file}:${f.line} ${f.message}`), [], name);
});

test("every check has fixtures", () => {
  assert.deepEqual(Object.keys(BAD).sort(), all.map((c) => c.name).sort());
  for (const n of Object.keys(BAD)) for (const d of ["bad", "good"]) assert.ok(fs.existsSync(path.join(FIX, n, d)), `${n}/${d}`);
});

test("an ignore marker counts only in a real comment", () => {
  assert.equal(run("json-deep-clone", "marker").length, 0);
  assert.equal(run("json-deep-clone", "marker-in-a-string").length, 1);
});

test("an archive folder is not read", () => {
  assert.deepEqual(load(path.join(FIX, "archive-skip")).files.map((f) => f.path), ["x.ts"]);
});
