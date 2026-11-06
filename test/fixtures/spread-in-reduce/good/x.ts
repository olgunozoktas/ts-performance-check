export const byId = (xs: { id: string }[]) => xs.reduce((acc, x) => { (acc as any)[x.id] = x; return acc; }, {});
export const sums = (xs: { a: number }[]) => xs.reduce((acc, x) => acc + x.a, 0);
export const keys = (xs: object[]) => xs.reduce((acc: number, x) => acc + Object.keys({ ...x }).length, 0);
export const merged = (xs: object[]) => xs.map((x) => ({ ...x }));
