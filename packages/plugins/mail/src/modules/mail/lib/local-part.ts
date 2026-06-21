const FOLD: Record<string, string> = {
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u",
};

function fold(s: string): string {
  return s
    .toLowerCase()
    .split("")
    .map((ch) => FOLD[ch] ?? ch)
    .join("")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function buildLocalPart(first: string, last: string, taken: Set<string>): string {
  const base = `${fold(first)}.${fold(last)}`.replace(/^\.|\.$/g, "");
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}.${n}`)) n++;
  return `${base}.${n}`;
}
