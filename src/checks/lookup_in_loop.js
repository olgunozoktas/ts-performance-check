import { at, walk, calleeName, inLoop, skipParens, ts } from "../core.js";

const SCANS = new Set(["find", "findIndex", "filter", "some", "findLast", "findLastIndex"]);
const isLoopCallback = (n) => ts.isCallExpression(n) && ["map", "forEach", "filter", "reduce", "some", "every", "flatMap"].includes(calleeName(n));

/** True when a scan's callback is a join on a key: (o) => o.id === x.id, where x comes from outside the callback. */
function isJoin(f, call) {
  const cb = call.arguments[0];
  if (!cb || !ts.isArrowFunction(cb) || cb.parameters.length < 1 || !ts.isIdentifier(cb.parameters[0].name)) return false;
  const p = cb.parameters[0].name.text, body = skipParens(ts.isBlock(cb.body) ? null : cb.body);
  if (!body || !ts.isBinaryExpression(body) || ![ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken].includes(body.operatorToken.kind)) return false;
  const mine = (e) => new RegExp(`^${p}\\b`).test(e.getText(f.ast));
  return mine(body.left) !== mine(body.right) && [body.left, body.right].every((e) => ts.isPropertyAccessExpression(e) || ts.isIdentifier(e));
}

// list.find((o) => o.id === x.id) for every x of another list: a join in n × m steps. A Map built once looks up in one.
export default {
  name: "lookup-in-loop",
  run(project) {
    const out = [];
    for (const f of project.files) {
      walk(f, (n, stack) => {
        if (!ts.isCallExpression(n) || !SCANS.has(calleeName(n)) || !ts.isPropertyAccessExpression(n.expression) || !isJoin(f, n)) return;
        const fnIndex = stack.findLastIndex((s, i) => i < stack.length - 1 && ts.isFunctionLike(s));
        const inCallback = fnIndex > 0 && isLoopCallback(stack[fnIndex - 1]) && stack[fnIndex - 1] !== n;
        if (!inLoop(stack) && !inCallback) return;
        out.push(at("lookup-in-loop", "low", f, n, `.${calleeName(n)}() joins two lists on a key inside a loop: n × m steps.`,
          "Build a Map once before the loop (const byId = new Map(list.map((o) => [o.id, o]))), then byId.get(x.id)."));
      });
    }
    return out;
  },
};
