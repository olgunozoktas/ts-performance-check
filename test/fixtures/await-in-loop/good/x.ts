declare function f(x: number): Promise<number>; declare function list(): Promise<number[]>; declare const reader: any; declare const stream: AsyncIterable<number>; declare function sleep(ms: number): Promise<void>;
export async function a(items: number[]) {
  for await (const x of stream) await f(x);
  for (;;) { const { done } = await reader.read(); if (done) break; }
  while (true) { const v = await f(1); if (v) break; }
  for (const x of items) { if (await f(x)) return x; }
  for (const x of await list()) console.log(x);
  for (const x of items) { await f(x); await sleep(100); }
  return Promise.all(items.map((x) => f(x)));
}
