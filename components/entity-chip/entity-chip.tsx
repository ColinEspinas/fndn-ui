import type { HTMLAttributes } from "react";
import { Avatar } from "../avatar/avatar";
import { entityChip } from "./entity-chip.recipe";

export type EntityChipProps = HTMLAttributes<HTMLSpanElement> & {
  name: string;
  /** Any CSS color for the monogram (our avatar); defaults to the orange token. */
  color?: string;
  /** Glyph in the disc; defaults to the first character of name. */
  monogram?: string;
};

/** First grapheme of a name, upper-cased: "jo" → "J", "🚀 Launch" → "🚀", "élan" → "É". */
function initial(name: string): string {
  const text = name.trim();
  if (!text) return "";
  const first =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)[Symbol.iterator]().next().value?.segment
      : Array.from(text)[0];
  return (first ?? "").toLocaleUpperCase();
}

/** Monogram + name in a soft field pill. */
export function EntityChip({ name, color, monogram, className, ...rest }: EntityChipProps) {
  const r = entityChip();
  return (
    <span data-slot="entity-chip" className={r.base({ class: className })} title={name} {...rest}>
      <Avatar initials={monogram ?? initial(name)} size={16} shape="round" color={color} />
      <span data-slot="entity-chip-name" className={r.name()}>{name}</span>
    </span>
  );
}
