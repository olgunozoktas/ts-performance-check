import { at, walk, calleeName, skipParens, ts } from "../core.js";

// reduce((acc, x) => ({ ...acc, … })) or [...acc, x]: each step copies everything so far, so n items cost n² copies.
export default {
  name: "spread-in-reduce",
  run(project) {
    const out = [];
    for (const f of project.files) {
      if (!f.text.includes("reduce")) continue;
      walk(f, (n) => {
        if (!ts.isCallExpression(n) || calleeName(n) !== "reduce" || !n.arguments[0] || !ts.isFunctionLike(n.arguments[0])) return;
        const fn = n.arguments[0], acc = fn.parameters[0]?.name.getText(f.ast);
        if (!acc) return;
        let copies = false;
        const look = (m) => {
          if ((ts.isSpreadAssignment(m) || ts.isSpreadElement(m)) && skipParens(m.expression).getText(f.ast) === acc) copies = true;
          if (!copies) ts.forEachChild(m, look);
        };
        look(fn.body);
        if (copies) out.push(at("spread-in-reduce", "medium", f, n, `reduce() copies its accumulator (...${acc}) on every step: n items cost n² copies.`,
          `Change the accumulator in place and return it (acc[k] = v; return acc), or build a Map, or use Object.fromEntries(items.map(…)).`));
      });
    }
    return out;
  },
};
