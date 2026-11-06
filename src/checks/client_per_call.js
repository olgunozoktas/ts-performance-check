import { at, walk, calleeName, ts } from "../core.js";

// A factory or start-up function by its name: new…, create…, make…, init…, setup…, build…, main, get…Client.
const KEEP = /^(new|create|make|init|setup|build)(?![a-z])\w*$|^main$|^get\w*Client$/;

// A new HTTP agent, an axios instance or a database pool made inside a function for each call: no connection is reused,
// so each call pays a new TCP and TLS handshake. Made once (a module constant, a constructor, a factory) it is fine.
export default {
  name: "client-per-call",
  run(project) {
    const out = [];
    for (const f of project.files) {
      walk(f, (n, stack) => {
        let what = "";
        if (ts.isNewExpression(n) && /^(https?\.)?Agent$|^(Pool|PrismaClient|Redis)$/.test(n.expression.getText(f.ast)) && /\b(https?|pg|mysql2?|prisma|ioredis|undici)\b/.test(f.text)) what = n.expression.getText(f.ast);
        if (ts.isCallExpression(n) && calleeName(n) === "create" && /^axios\.create$/.test(n.expression.getText(f.ast))) what = "axios.create()";
        if (!what) return;
        const fn = [...stack].reverse().find((s) => s !== n && ts.isFunctionLike(s));
        if (!fn) return; // a module constant: made once
        const name = fn.name?.getText(f.ast) ?? (ts.isVariableDeclaration(fn.parent) ? fn.parent.name.getText(f.ast) : "");
        if (ts.isConstructorDeclaration(fn) || KEEP.test(name)) return;
        // Stored for later (this.x = …, a cache) or returned: a factory, not a per-call client.
        const parent = n.parent;
        if (ts.isReturnStatement(parent) || ts.isArrowFunction(parent) || (ts.isBinaryExpression(parent) && /^(this\.|\w+\.(client|agent|pool)|cache)/i.test(parent.left.getText(f.ast)))) return;
        out.push(at("client-per-call", "medium", f, n, `${what} is made inside ${name || "a function"} on each call: no connection is reused.`,
          "Make it once (a module constant, or in the constructor) and reuse it in every call."));
      });
    }
    return out;
  },
};
