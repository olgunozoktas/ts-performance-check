import express from "express"; import fs from "node:fs"; import { execSync } from "node:child_process";
const app = express();
app.get("/a", (req: any, res: any) => res.send(fs.readFileSync("a.txt")));
export async function build() { return execSync("git rev-parse HEAD"); }
