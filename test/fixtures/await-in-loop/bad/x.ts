declare function save(x: number): Promise<void>; declare function f(x: number): Promise<number>;
export async function a(items: number[]) {
  for (const x of items) { await save(x); }
  const results: number[] = [];
  for (let i = 0; i < items.length; i++) results.push(await f(items[i]));
  return results;
}
