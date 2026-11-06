import { at, walk, calleeName, ts } from "../core.js";

const SYNC = new Set(["readFileSync", "writeFileSync", "appendFileSync", "readdirSync", "statSync", "existsSync", "mkdirSync", "copyFileSync",
  "execSync", "spawnSync", "execFileSync", "pbkdf2Sync", "scryptSync", "gzipSync", "gunzipSync", "brotliCompressSync", "deflateSync", "inflateSync"]);
const isHandler = (fn) => fn.parameters?.length >= 2 && /^(req|request)$/.test(fn.parameters[0].name.getText()) && /^(res|reply|response)$/.test(fn.parameters[1].name.getText());
const isAsync = (fn) => (ts.getCombinedModifierFlags(fn) & ts.ModifierFlags.Async) !== 0;

// A blocking call (fs …Sync, execSync, pbkdf2Sync, zlib …Sync) in an async function or a request handler: it stops
// the event loop, so every other request waits. In a CLI, a build script or start-up code it is fine.
export default {
  name: "sync-io-in-async",
  run(project) {
    const out = [];
    for (const f of project.files) {
      if (!/Sync\(/.test(f.text)) continue;
      // An async function blocks other requests only in a server: a CLI or a build script waits for its own work.
      const server = /from ["'](express|fastify|koa|hono|@hono\/node-server|next\/server|@nestjs\/\w+)["']|\bcreateServer\(|^["']use server["']/m.test(f.text);
      walk(f, (n, stack) => {
        if (!ts.isCallExpression(n) || !SYNC.has(calleeName(n))) return;
        const fn = [...stack].reverse().find((s) => s !== n && ts.isFunctionLike(s));
        if (!fn || !(isHandler(fn) || (server && isAsync(fn)))) return;
        out.push(at("sync-io-in-async", "medium", f, n, `${calleeName(n)}() blocks the event loop inside ${isHandler(fn) ? "a request handler" : "an async function"}: every other request waits.`,
          `Use the async form (fs.promises.${calleeName(n).replace(/Sync$/, "")}, util.promisify), or do it once at start-up.`));
      });
    }
    return out;
  },
};
