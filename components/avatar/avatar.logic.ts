/* avatar — shared by the React, Vue and Svelte adapters.
 * Plain TypeScript, no framework imports. */

const graphemes = (s: string): string[] => {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: "grapheme" }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  return Seg ? Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(s), (x) => x.segment) : Array.from(s);
};

/** Letters for an avatar: the first letter of the first and last word ("Kumo Capital" → "KC");
 * one letter when `max` is 1 (the 12 and 14px sizes). */
export function initialsOf(name: string | undefined, max: 1 | 2 = 2): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const first = graphemes(words[0]!)[0] ?? "";
  const last = words.length > 1 ? graphemes(words[words.length - 1]!)[0] ?? "" : "";
  return (max === 1 ? first : first + last).toLocaleUpperCase();
}

/** How many letters fit at a size. */
export const maxInitials = (size: string | number | undefined): 1 | 2 => (Number(size ?? 16) <= 14 ? 1 : 2);

/** True when an <img> has finished and failed (it may have failed before anyone listened). */
export const imageFailed = (img: HTMLImageElement): boolean => img.complete && img.naturalWidth === 0;
