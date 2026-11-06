type U = { id: string; ownerId: string };
export function a(items: U[], other: U[], users: U[]) {
  const pairs = items.map((x) => other.find((o) => o.id === x.id));
  for (const u of users) console.log(items.filter((o) => o.ownerId === u.id));
  return pairs;
}
