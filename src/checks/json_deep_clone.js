import { at, walk, ts } from "../core.js";

// JSON.parse(JSON.stringify(x)): a slow deep copy that also drops Dates, Maps, undefined and NaN.
export default {
  name: "json-deep-clone",
  run(project) {
    const out = [];
    for (const f of project.files) {
      if (!f.text.includes("JSON.stringify")) continue;
      walk(f, (n) => {
        if (ts.isCallExpression(n) && /^JSON\.parse$/.test(n.expression.getText(f.ast)) && n.arguments[0] && ts.isCallExpression(n.arguments[0]) &&
            /^JSON\.stringify$/.test(n.arguments[0].expression.getText(f.ast))) {
          out.push(at("json-deep-clone", "low", f, n, "JSON.parse(JSON.stringify(x)) copies through a string: slow, and it loses Dates, Maps, undefined and NaN.",
            "Use structuredClone(x) (Node 17+, every current browser)."));
        }
      });
    }
    return out;
  },
};
