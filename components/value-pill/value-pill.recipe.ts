import { tv, type VariantProps } from "../lib/tv";

/* value-pill — a plain value (a date, a name, a count) set off in prose.
 * No dot, no state; the ring is a 28% tint of the tone. It stays on one line while it fits its
 * container; a value longer than the container wraps inside the pill, never truncates.
 * The value reads in its own direction on either page: a signed number stays "-4.41%".
 *
 * No motion; one element, so the recipe is `base` only. */

export const valuePill = tv({
  base: [
    /* the inline margins stay inside the container */
    "inline-flex shrink-0 items-center max-w-[calc(100%-4px)] mx-0.5 px-1.5 rounded-pill align-middle",
    "bg-field text-ink-2 shadow-hairline",
    "text-xs font-medium tabular-nums leading-[1.5] wrap-anywhere [unicode-bidi:plaintext]",
  ],
  variants: {
    tone: {
      neutral: "",
      green: "bg-green-tint text-green shadow-[0_0_0_1px_color-mix(in_oklch,var(--fndn-green)_28%,transparent)]",
      orange: "bg-orange-tint text-orange shadow-[0_0_0_1px_color-mix(in_oklch,var(--fndn-orange)_28%,transparent)]",
      red: "bg-red-tint text-red shadow-[0_0_0_1px_color-mix(in_oklch,var(--fndn-red)_28%,transparent)]",
      accent: "bg-accent-tint text-accent-ink shadow-[0_0_0_1px_color-mix(in_oklch,var(--fndn-accent)_28%,transparent)]",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type ValuePillRecipeProps = VariantProps<typeof valuePill>;
