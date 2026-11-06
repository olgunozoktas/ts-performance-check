import https from "node:https"; import axios from "axios";
export function get(url: string) { const agent = new https.Agent({ keepAlive: true }); return fetch(url, { agent } as any); }
export async function call() { const c = axios.create(); return c.get("/x"); }
