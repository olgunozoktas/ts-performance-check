import fs from "node:fs";
export async function cli() { return fs.readFileSync("a.txt"); }
export function start() { return fs.readFileSync("config.json"); }
export async function h(req: any, res: any) { res.send(await fs.promises.readFile("a.txt")); }
