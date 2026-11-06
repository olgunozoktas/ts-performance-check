import https from "node:https"; import axios from "axios";
const agent = new https.Agent({ keepAlive: true });
export const api = axios.create({ baseURL: "/api" });
export class Client { agent: https.Agent; constructor() { this.agent = new https.Agent(); } }
export function createAgent() { const a = new https.Agent(); a.setMaxListeners(1); return a; }
export function createClient() { return axios.create(); }
export function get(url: string) { return fetch(url, { agent } as any); }
