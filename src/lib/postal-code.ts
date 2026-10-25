const POSTAL_PATTERN = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/;

export function normalizePostal(value: string): string | null {
  const code = value.replace(/\s+/g, "").toUpperCase();
  return POSTAL_PATTERN.test(code) ? code : null;
}
