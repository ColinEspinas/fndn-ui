/* Date text — how the date picker's field shows its dates and reads what is typed into it.
 *
 * Shown: the locale's short readable date ("Mar 10, 2025", "10. März 2025"), and a range as one
 * phrase through Intl.DateTimeFormat#formatRange, which leaves out what both ends share
 * ("Mar 10 – 28, 2025", "Mar 28 – Apr 2, 2025", "Dec 30, 2025 – Jan 2, 2026").
 *
 * Read: what is shown reads back, and so do the forms people type: the locale's numeric date
 * (03/10/2025, 10.03.2025), ISO (2025-03-10), month names in the locale or in English, short or
 * long ("mar 10", "10 march"), the locale's digits, a two-digit year, a missing year (this year).
 * A range is two dates joined by a dash or "to"; an end that leaves out its month or year takes
 * the start's, and a start that leaves out its year takes the end's ("Mar 10 – 28, 2025",
 * "Dec 30 – Jan 2"). Dates are ISO strings ("2025-03-10") in and out, so the adapters and tests
 * share one reading. Gregorian calendar. */

export type DateTextMode = "single" | "multiple" | "range";

type Part = { year?: number; month?: number; day?: number };

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (p: Required<Part>) => `${String(p.year).padStart(4, "0")}-${pad(p.month)}-${pad(p.day)}`;
const utc = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(2000, 0, 1));
  date.setUTCFullYear(y!, m! - 1, d!);
  return date;
};
const daysIn = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(locale: string, options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = formatters.get(key);
  if (!f) {
    try { f = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC", calendar: "gregory" }); }
    catch { f = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }); }
    formatters.set(key, f);
  }
  return f;
}

/** The dates as the field shows them. single: one date; range: one phrase (an open range ends on
 * its dash); multiple: the dates joined by a middle dot. */
export function formatDateText(values: ReadonlyArray<string>, locale: string, mode: DateTextMode = "single"): string {
  const dates = values.filter(Boolean);
  if (!dates.length) return "";
  const f = formatter(locale);
  if (mode === "range") {
    const [a, b] = dates;
    if (!b || a === b) return b ? f.format(utc(a!)) : `${f.format(utc(a!))} –`;
    return f.formatRange(utc(a!), utc(b));
  }
  if (mode === "multiple") return dates.map((d) => f.format(utc(d))).join(" · ");
  return f.format(utc(dates[0]!));
}

/* ── reading ─────────────────────────────────────────────────────────────── */

const vocabularies = new Map<string, { months: [string, number][]; digits: Map<string, string>; order: ("year" | "month" | "day")[] }>();
const squash = (s: string) => s.toLocaleLowerCase().normalize("NFC").replace(/[.\s]/g, "");

function vocabulary(locale: string) {
  let v = vocabularies.get(locale);
  if (v) return v;
  const months: [string, number][] = [];
  for (const loc of [locale, "en-US"]) {
    for (let m = 1; m <= 12; m++) {
      const date = new Date(Date.UTC(2025, m - 1, 15));
      for (const style of ["long", "short"] as const) {
        months.push([squash(formatter(loc, { month: style }).format(date)), m]);
        /* the form a month takes inside a date (genitive in Slavic languages, for instance) */
        const inDate = formatter(loc, { month: style, day: "numeric" }).formatToParts(date).find((p) => p.type === "month")?.value;
        if (inDate) months.push([squash(inDate), m]);
      }
    }
  }
  const digits = new Map<string, string>();
  try {
    const nf = new Intl.NumberFormat(locale, { useGrouping: false });
    for (let d = 0; d <= 9; d++) digits.set(nf.format(d), String(d));
  } catch { /* ASCII digits only */ }
  const order = formatter(locale, { year: "numeric", month: "numeric", day: "numeric" })
    .formatToParts(new Date(Date.UTC(2025, 2, 10)))
    .map((p) => p.type)
    .filter((t): t is "year" | "month" | "day" => t === "year" || t === "month" || t === "day");
  v = { months: months.filter(([name]) => name.length > 0), digits, order: order.length === 3 ? order : ["month", "day", "year"] };
  vocabularies.set(locale, v);
  return v;
}

function monthOf(word: string, months: [string, number][]): number | undefined {
  const w = squash(word);
  const exact = months.find(([name]) => name === w);
  if (exact) return exact[1];
  if ([...w].length < 3) return undefined;
  const found = new Set(months.filter(([name]) => name.startsWith(w)).map(([, m]) => m));
  return found.size === 1 ? [...found][0] : undefined;
}

const year4 = (n: string) => {
  const y = Number(n);
  if (n.length > 2) return y;
  const now = new Date().getFullYear();
  /* two digits: the nearest century that keeps the year within 20 years ahead of now */
  return y + 100 * Math.floor((now + 20 - y) / 100);
};

/** One date, possibly partial (a range's end may leave out its month and year). */
function readPart(text: string, locale: string): Part | null {
  const v = vocabulary(locale);
  let s = text;
  for (const [local, ascii] of v.digits) if (local !== ascii) s = s.split(local).join(ascii);
  s = s.trim();
  if (!s) return null;
  const isoMatch = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (isoMatch) return { year: +isoMatch[1]!, month: +isoMatch[2]!, day: +isoMatch[3]! };
  const tokens = s.match(/\d+|[\p{L}\p{M}]+/gu) ?? [];
  const numbers: string[] = [];
  let month: number | undefined;
  for (const t of tokens) {
    if (/^\d+$/.test(t)) numbers.push(t);
    else if (month === undefined) month = monthOf(t, v.months);
  }
  if (month !== undefined) {
    const part: Part = { month };
    const long = numbers.find((n) => n.length > 2);
    if (long) part.year = Number(long);
    const rest = numbers.filter((n) => n !== long);
    if (rest[0] !== undefined) part.day = Number(rest[0]);
    if (rest[1] !== undefined && part.year === undefined) part.year = year4(rest[1]);
    return part;
  }
  if (!numbers.length) return null;
  if (numbers.length >= 3) {
    const [a, b, c] = numbers as [string, string, string];
    if (a.length > 2) return { year: Number(a), month: Number(b), day: Number(c) };
    const part: Part = {};
    v.order.forEach((type, i) => { const n = [a, b, c][i]!; part[type] = type === "year" ? year4(n) : Number(n); });
    return part;
  }
  if (numbers.length === 2) {
    const [a, b] = numbers as [string, string];
    /* "28, 2025": a range's end that only gives its day and year */
    if (a.length > 2 !== b.length > 2) return { day: Number(a.length > 2 ? b : a), year: Number(a.length > 2 ? a : b) };
    if (a.length > 2) return null;
    const md = v.order.filter((t) => t !== "year");
    return { [md[0]!]: Number(a), [md[1]!]: Number(b) } as Part;
  }
  return { day: Number(numbers[0]) };
}

function complete(p: Part, fallback: { year: number; month: number }): string | null {
  const year = p.year ?? fallback.year;
  const month = p.month ?? fallback.month;
  const day = p.day;
  if (day === undefined || month < 1 || month > 12 || year < 1 || year > 9999) return null;
  if (day < 1 || day > daysIn(year, month)) return null;
  return iso({ year, month, day });
}

const RANGE = /\s*[–—→～〜]\s*|\s+-\s+|\s+(?:to|until|till)\s+|\s*\.\.\.?\s*/i;

/** What was typed, as ISO dates: [] for an empty field, null when it is not a date (or, in range
 * mode, not one or two). In range mode the result is sorted; one date is an open range. */
export function parseDateText(text: string, locale: string, mode: DateTextMode = "single"): string[] | null {
  const s = text.trim();
  if (!s) return [];
  const now = new Date();
  const today = { year: now.getFullYear(), month: now.getMonth() + 1 };
  if (mode === "multiple") {
    const out: string[] = [];
    for (const piece of s.split(/\s*[·;]\s*/)) {
      if (!piece) continue;
      const p = readPart(piece, locale);
      const d = p && complete(p, today);
      if (!d) return null;
      if (!out.includes(d)) out.push(d);
    }
    return out.sort();
  }
  const sides = mode === "range" ? s.split(RANGE).filter((x) => x.trim() !== "") : [s];
  if (sides.length > 2) return null;
  if (sides.length === 1) {
    const p = readPart(sides[0]!, locale);
    const d = p && complete(p, today);
    return d ? [d] : null;
  }
  const a = readPart(sides[0]!, locale);
  const b = readPart(sides[1]!, locale);
  if (!a || !b) return null;
  const startYearInherited = a.year === undefined;
  const endYearInherited = b.year === undefined;
  b.month ??= a.month;
  a.month ??= b.month;
  b.year ??= a.year;
  a.year ??= b.year;
  let start = complete(a, today);
  let end = complete(b, today);
  if (!start || !end) return null;
  /* "Dec 30 – Jan 2, 2026": the start lies in the year before; "Dec 30, 2025 – Jan 2": the end in
   * the year after */
  if (start > end && startYearInherited && !endYearInherited) start = complete({ ...a, year: (a.year ?? today.year) - 1 }, today);
  else if (start > end && endYearInherited) end = complete({ ...b, year: (b.year ?? today.year) + 1 }, today);
  if (!start || !end) return null;
  return start <= end ? [start, end] : [end, start];
}

/* ── the engine's input props ────────────────────────────────────────────── */

/* The engine's own input accepts only digits and the locale's separator and parses the locale's
 * numeric date; the field shows and reads words, so it takes the rest of the engine's input props
 * (id, label wiring, data-state, disabled, read-only, invalid, the click that opens the calendar
 * and leaves the caret in the field, the focus that tracks the active input) and none of these.
 * Nor its data-part: the engine writes its numeric text into every element marked as its input
 * whenever the value changes. The field stays the engine's trigger (ids.trigger), so the engine
 * still hands focus back to it and never counts a press on it as a press outside. */
const OWN = new Set(["data-part", "value", "defaultvalue", "placeholder", "dir", "name", "onbeforeinput", "oninput", "onchange", "onblur", "onkeydown", "onfocusout"]);

/** The engine's input props without its text handling (keys compared without case, so React's,
 * Vue's and Svelte's spellings all go). */
export function engineInputProps<T extends Record<string, unknown>>(props: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) if (!OWN.has(k.toLowerCase())) out[k] = v;
  return out as Partial<T>;
}
