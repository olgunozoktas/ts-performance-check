export const byId = (xs: { id: string }[]) => xs.reduce((acc, x) => ({ ...acc, [x.id]: x }), {});
export const all = (xs: number[][]) => xs.reduce((acc, x) => [...acc, ...x], [] as number[]);
