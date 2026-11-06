type U = { id: string; tags: string[] };
export function a(items: U[], other: U[], ids: string[]) {
  const one = other.find((o) => o.id === "x");
  const tagged = items.filter((x) => x.tags.includes("a"));
  for (const id of ids) console.log(["a", "b"].includes(id), id.includes("-"));
  for (const id of ids) console.log(other.some((o) => o.tags.length > 2), id);
  const byId = new Map(other.map((o) => [o.id, o]));
  return [one, tagged, items.map((x) => byId.get(x.id))];
}
