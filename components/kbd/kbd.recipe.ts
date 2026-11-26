import { tv, type VariantProps } from "../lib/tv";

/* kbd — keyboard hint, one or more keys. boxed: each key a small raised key (docs, palettes);
 * plain: text in the surrounding font and colour (tooltips, menu rows).
 *
 * Both parts are <kbd>, which the browser sets in monospace: the family is inherited back, so the
 * hint takes the surrounding font (a boxed key then sets its own mono family).
 * No motion. The root slot is `base`, each key is `key`. */

export const kbd = tv({
  slots: {
    base: "inline-flex shrink-0 items-center gap-0.5 [font-family:inherit] leading-none whitespace-nowrap align-middle",
    key: "",
  },
  variants: {
    variant: {
      boxed: {
        key: "inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-chip bg-surface shadow-btn font-mono text-2xs text-ink-2",
      },
      plain: {
        base: "gap-px text-2xs font-normal text-inherit",
        key: "[font-family:inherit]",
      },
    },
  },
  defaultVariants: { variant: "boxed" },
});

export type KbdRecipeProps = VariantProps<typeof kbd>;
