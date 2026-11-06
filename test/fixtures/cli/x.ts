export const a = (xs: number[]) => xs.reduce((acc, x) => [...acc, x], [] as number[]);
export const copy = (x: object) => JSON.parse(JSON.stringify(x));
