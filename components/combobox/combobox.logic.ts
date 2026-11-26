/* combobox — shared by the three adapters (plain TypeScript, no DOM).
 *
 * matchParts: the label cut around the first place it contains what was typed (case and accents
 * as typed: a plain case-insensitive search, the same the filter uses), so the adapter can draw
 * the match in ink and the rest dimmer. null when nothing was typed or the option was found by a
 * keyword (no part of its label to mark). */
export function matchParts(label: string, query: string): [string, string, string] | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  const at = label.toLowerCase().indexOf(needle);
  /* toLowerCase can change a string's length (İ → i̇): then the indexes would not line up */
  if (at < 0 || label.toLowerCase().length !== label.length) return null;
  return [label.slice(0, at), label.slice(at, at + needle.length), label.slice(at + needle.length)];
}
