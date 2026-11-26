import { tv, type VariantProps } from "../lib/tv";

/* shimmer — shimmering label; signals the agent is processing. The text is a window onto a
 * gradient twice its width that slides across it (1.8s, 1.4s fast); it stops under reduced motion
 * and forced colours. @keyframes fndn-shimmer-text is in base.css; one element,
 * so the recipe is `base` only.
 *
 * Reduced motion: the label reads as plain secondary text. Forced colours drop background images,
 * which would leave the transparent text invisible: it takes the system text colour. */

export const shimmer = tv({
  base: [
    "inline-block bg-size-[200%_100%] bg-clip-text text-transparent",
    "animate-[fndn-shimmer-text_1.8s_linear_infinite] motion-reduce:animate-none forced-colors:animate-none",
    "motion-reduce:bg-none forced-colors:bg-none forced-colors:text-[color:CanvasText]",
  ],
  variants: {
    speed: {
      normal: "",
      fast: "motion-safe:not-forced-colors:animate-[fndn-shimmer-text_1.4s_linear_infinite]",
    },
    tone: {
      ink: "bg-[linear-gradient(90deg,var(--fndn-ink-3)_35%,var(--fndn-ink)_50%,var(--fndn-ink-3)_65%)] motion-reduce:text-ink-2",
      /* the same sweep in the accent hue, for a hint that invites an action */
      accent: "bg-[linear-gradient(90deg,var(--fndn-accent)_35%,var(--fndn-accent-ink)_50%,var(--fndn-accent)_65%)] motion-reduce:text-accent",
    },
  },
  defaultVariants: { speed: "normal", tone: "ink" },
});

export type ShimmerRecipeProps = VariantProps<typeof shimmer>;
