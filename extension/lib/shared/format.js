const KEEP_UPPER = new Set(["PC", "PC®", "BBQ", "XL", "XXL", "AA", "AAA", "II", "UHT", "PEI", "BC"]);
const UNITS = /^(\d+(\.\d+)?)?(g|kg|ml|l|lb|lbs|oz|pk|ct)$/i;
const SMALL = new Set(["or", "and", "of", "with", "in", "for", "the", "a", "an", "to", "on", "per"]);

function capitalize(word) {
  return word.toLowerCase().replace(/(^|[-/(])([a-zà-ÿ])/g, (_, lead, letter) => lead + letter.toUpperCase());
}

export function tidyName(name) {
  const letters = name.replace(/[^a-z]/gi, "");
  const upper = letters.replace(/[^A-Z]/g, "").length;
  if (letters.length === 0 || upper / letters.length < 0.8) return name;

  let first = true;
  return name
    .split(/(\s+)/)
    .map((word) => {
      if (/^\s+$/.test(word)) return word;
      const bare = word.replace(/[,.;:]+$/, "");
      let out;
      if (KEEP_UPPER.has(bare)) out = word;
      else if (UNITS.test(bare)) out = word.toLowerCase().replace(/^(\d*)l\b/, "$1 L").replace(/^ L/, "L");
      else if (!first && SMALL.has(bare.toLowerCase())) out = word.toLowerCase();
      else out = capitalize(word);
      first = false;
      return out;
    })
    .join("")
    .replace(/(\d+)'s\b/gi, "$1s");
}

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "America/Toronto",
});

export function formatDay(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : dayFormat.format(date);
}

export function formatRange(from, to) {
  return `${formatDay(from)} to ${formatDay(to)}`;
}

export function formatPostal(code) {
  return code ? `${code.slice(0, 3)} ${code.slice(3)}` : "";
}
