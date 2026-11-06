import { at, walk, ts } from "../core.js";

const HEAVY = { lodash: "import only what you use: import debounce from 'lodash/debounce' (or lodash-es)", moment: "use date-fns, dayjs or Intl.DateTimeFormat: moment is large and has no tree shaking" };

// The whole of a large library in a browser bundle (import _ from "lodash", import moment): each page loads all of it.
export default {
  name: "heavy-import",
  run(project) {
    const out = [];
    for (const f of project.files) {
      if (!/lodash|moment/.test(f.text)) continue;
      walk(f, (n) => {
        const spec = ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier) ? n.moduleSpecifier.text : null;
        if (!spec || !(spec in HEAVY)) return;
        out.push(at("heavy-import", "low", f, n, `import from "${spec}" brings in the whole library: a browser bundle loads all of it.`, HEAVY[spec] + "."));
      });
    }
    return out;
  },
};
