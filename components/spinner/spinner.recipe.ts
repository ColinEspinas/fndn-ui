import { tv, type VariantProps } from "../lib/tv";

/* spinner — ring with a single ink-2 arc; sits on the middle of the text when used inline.
 * The spin is fast on purpose: a quick spinner makes the wait feel shorter. It keeps spinning under
 * reduced motion; it is the loading signal. @keyframes fndn-spin is in base.css;
 * one element, so the recipe is `base` only. */

export const spinner = tv({
  base: "inline-block shrink-0 size-3 rounded-[50%] border-[1.5px] border-solid border-line-strong border-t-ink-2 align-[-0.125em] animate-[fndn-spin_700ms_linear_infinite]",
  variants: {
    size: {
      sm: "size-3",
      md: "size-4 border-2",
      lg: "size-6 border-2",
    },
  },
  defaultVariants: { size: "sm" },
});

export type SpinnerRecipeProps = VariantProps<typeof spinner>;
