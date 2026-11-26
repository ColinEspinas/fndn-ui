import { tv, type VariantProps } from "../lib/tv";

/* progress-ring — small ring with content in the center, the task badge.
 * --fndn-progress (0..1, set by the adapter) drives the arc; pathLength="100" on the circles keeps
 * the math size-independent.
 *
 * Motion included: the arc travels when progress changes (reduced motion makes it jump). The
 * first slot is `base`. */

export const progressRing = tv({
  slots: {
    base: "[--fndn-progress:0] relative inline-flex shrink-0 items-center justify-center size-7 align-middle",
    /* the arc starts at the top */
    svg: "absolute inset-0 size-full -rotate-90",
    track: "fill-none stroke-line stroke-2",
    bar: [
      "fill-none stroke-orange stroke-2 [stroke-linecap:round]",
      "[stroke-dasharray:100] [stroke-dashoffset:calc(100*(1-var(--fndn-progress)))]",
      "motion-also-[stroke-dashoffset_var(--fndn-duration-move)_var(--fndn-easing-out-strong)]",
      /* a tone change (orange → green on completion) fades with the travel, as the progress bar does */
      "motion-colors-base",
    ],
    label: "relative text-xs font-semibold tabular-nums leading-none text-ink",
  },
  variants: {
    size: {
      sm: { base: "size-6", label: "text-2xs" },
      md: { base: "size-7" },
    },
    tone: {
      orange: {},
      green: { bar: "stroke-green" },
      red: { bar: "stroke-red" },
      accent: { bar: "stroke-accent" },
    },
  },
  defaultVariants: { size: "md", tone: "orange" },
});

export type ProgressRingRecipeProps = VariantProps<typeof progressRing>;
