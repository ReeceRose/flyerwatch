export function normalizeItem(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanPantry(items) {
  return [...new Set(items.map(normalizeItem).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

/** "cumin" in the pantry also covers "ground cumin", but not "cumin seeds". */
export function pantryMatch(term, items) {
  return items.find((item) => term === item || term.endsWith(` ${item}`)) ?? null;
}
