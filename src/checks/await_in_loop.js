import { at, walk, inLoop, ts } from "../core.js";

// await inside a loop: each request waits for the one before it. Independent work runs together with Promise.all.
// for await (… of …) is a stream on purpose, and is not reported.
export default {
  name: "await-in-loop",
  run(project) {
    const out = [];
    for (const f of project.files) {
      if (!f.text.includes("await")) continue;
      walk(f, (n, stack) => {
        if (!ts.isAwaitExpression(n) || !inLoop(stack)) return;
        const i = stack.findLastIndex((s) => ts.isForOfStatement(s) || ts.isForStatement(s) || ts.isForInStatement(s) || ts.isWhileStatement(s) || ts.isDoStatement(s));
        const loop = stack[i];
        // Only a for loop over items: a while or do loop reads a stream or polls, one step after another on purpose.
        if (!loop || !(ts.isForOfStatement(loop) || ts.isForStatement(loop) || ts.isForInStatement(loop)) || (ts.isForOfStatement(loop) && loop.awaitModifier)) return;
        // In the loop's head (for (const x of await list())) it runs once.
        if (stack[i + 1] !== loop.statement) return;
        // A loop that stops early (a search for the first match) or waits on purpose (a retry, a sleep) is sequential by design.
        const body = loop.statement.getText(f.ast);
        if (/\b(break|return|throw)\b/.test(body) || /\b(sleep|delay|setTimeout|retry|backoff|wait)\w*\(/i.test(body)) return;
        out.push(at("await-in-loop", "low", f, n, "await inside a loop: each iteration waits for the one before it.",
          "When the iterations do not depend on each other: await Promise.all(items.map(async (x) => …)) (limit the concurrency for many items)."));
      });
    }
    return out;
  },
};
