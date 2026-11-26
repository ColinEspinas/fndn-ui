import { tv, type VariantProps } from "../lib/tv";

/* progress — a linear progress bar (Zag progress through Ark UI). The model is the progress ring:
 * the same track colour (line), the same tones (orange by default), the same travel when the value
 * changes (duration.move, easing.out-strong). Sizes have no model: sm 4px, md 6px.
 *
 * The engine writes --percent (0..100) on the root and a width on the range. The range is kept as
 * wide as the track instead (w-full! beats the inline width) and moved by transform, so a change
 * travels on the compositor and the range's rounded end stays round (scaleX would squash it);
 * the track clips it. Right-to-left it moves the other way.
 *
 * Indeterminate (no value): a band a quarter of the track wide sweeps along it. It is drawn on the
 * track's ::before (Zag puts data-state on the track too), not on the range, so the range's transform
 * never changes kind: while indeterminate the range waits out of sight at translateX(-100%) (no
 * --percent), and a known value grows from the start at duration.move instead of a scaleX(-1) band
 * flipping into a translate. The band is a background moved with the shared fndn-shimmer-text loop
 * (background-position 150% → -50%, which at a 25% band runs from fully out at one end to fully out
 * at the other). That loop runs towards the start, so the band is mirrored left-to-right only.
 * It keeps moving under reduced motion: it is the loading signal, like the spinner.
 *
 * Parts are found by data-slot (progress, progress-label, progress-value, progress-track,
 * progress-range); the root slot is `base`. */

export const progress = tv({
  slots: {
    base: "grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5",
    label: "col-start-1 min-w-0 text-xs font-medium leading-4 text-ink-2 wrap-anywhere [unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
    value: "col-start-2 text-xs leading-4 text-ink-2 tabular-nums whitespace-nowrap [unicode-bidi:plaintext]",
    track: [
      "relative col-span-2 w-full overflow-hidden rounded-pill bg-line",
      /* indeterminate: the band sweeps along the track */
      "before:absolute before:inset-0 before:hidden before:content-[''] data-[state=indeterminate]:before:block",
      "before:bg-[linear-gradient(90deg,transparent,var(--_tone)_30%,var(--_tone)_70%,transparent)] before:bg-size-[25%_100%] before:bg-no-repeat",
      "before:animate-[fndn-shimmer-text_1.4s_linear_infinite] before:[transform:scaleX(-1)] [&:dir(rtl)]:before:[transform:none]",
    ],
    range: [
      "h-full w-full! rounded-pill bg-(--_tone)",
      "[transform:translateX(calc((var(--percent,0)_-_100)_*_1%))] [&:dir(rtl)]:[transform:translateX(calc((100_-_var(--percent,0))_*_1%))]",
      "motion-transform-move motion-colors-base",
    ],
  },
  variants: {
    size: {
      sm: { track: "h-1" },
      md: { track: "h-1.5" },
    },
    tone: {
      orange: { base: "[--_tone:var(--fndn-orange)]" },
      green: { base: "[--_tone:var(--fndn-green)]" },
      red: { base: "[--_tone:var(--fndn-red)]" },
      accent: { base: "[--_tone:var(--fndn-accent)]" },
    },
  },
  defaultVariants: { size: "md", tone: "orange" },
});

export type ProgressRecipeProps = VariantProps<typeof progress>;
