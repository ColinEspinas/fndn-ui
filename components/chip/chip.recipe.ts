import { tv, type VariantProps } from "../lib/tv";

/* chip — monospace token chip for code values like `updated_at`.
 * Inline, sits in running text on the sentence's baseline; a long value wraps instead of
 * overflowing, and each line fragment keeps its own padding and radius (box-decoration clone).
 * One element, so the recipe is `base` only. No motion. */

export const chip = tv({
  base: "inline py-0.5 px-1.5 rounded-chip font-mono text-xs leading-none align-baseline [overflow-wrap:anywhere] box-decoration-clone",
  variants: {
    tone: {
      neutral: "bg-inset text-ink-2",
      accent: "bg-accent-tint text-accent-ink",
      green: "bg-green-tint text-green",
      orange: "bg-orange-tint text-orange",
      red: "bg-red-tint text-red",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type ChipRecipeProps = VariantProps<typeof chip>;
