import { tv, type VariantProps } from "../lib/tv";

/* slider — pick a number (or a range) by dragging a thumb along a track (Ark UI slider).
 *   md (default)  24px control · 20px thumb      sm  18px control · 14px thumb
 * The control and the thumb are the switch's (md 24 high with a 20px thumb, sm 18 with 14); the
 * track is a 4px rail in the switch's colours: line-strong, and ink for the filled range. The thumb
 * is the segmented control's thumb (surface with shadow.btn), so it reads on the page, on the range
 * and in both themes.
 *
 * Root: a grid, label at the start and the value at the end of the first row (baselines shared),
 * the control below across both columns. The engine positions the thumb (inset-inline-start, with
 * the thumb kept inside the track) and the range (left / right), and puts touch-action: none on the
 * control. The thumb tracks the pointer 1:1: its travel never animates (a drag would lag; a click on
 * the track jumps, as a native range does), and keys move it instantly.
 *
 * Touch: the control is the hit area (the whole width, 24px high); on a coarse pointer it reaches
 * 8px above and below (40px), without changing its look. */
export const slider = tv({
  slots: {
    base: [
      "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5 w-full min-w-0",
      "data-disabled:opacity-50 data-disabled:pointer-events-none",
    ],
    label: "min-w-0 text-sm font-medium text-ink [overflow-wrap:anywhere] [unicode-bidi:plaintext]",
    /* the value never jitters in width while it changes; it keeps the end of the row */
    valueText: "col-start-2 justify-self-end text-sm tabular-nums whitespace-nowrap text-ink-2",
    control: [
      "col-span-full flex items-center w-full cursor-pointer",
      "pointer-coarse:after:content-[''] pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2",
    ],
    track: [
      "w-full h-1 overflow-hidden rounded-pill bg-line-strong",
      /* the switch's hover: the rail darkens a little under a mouse */
      "[@media(hover:hover)_and_(pointer:fine)]:[[data-slot=slider-control]:hover>&]:bg-[color-mix(in_oklch,var(--fndn-line-strong)_70%,var(--fndn-ink-3))]",
      "motion-colors-fast",
    ],
    range: "inset-y-0 bg-ink",
    /* centred on the control (the engine owns transform for the inline position; the block centring
     * is on translate). Pressed or dragged from a pointer it gives a little, as the switch's thumb;
     * never from the keyboard. Hovered by a mouse it lifts (shadow-raised at duration.fast). Above the
     * coarse hit area so it stays grabbable. */
    thumb: [
      "kbd-instant",
      "top-1/2 -translate-y-1/2 z-1 rounded-[50%] bg-surface shadow-btn cursor-grab",
      "data-dragging:cursor-grabbing",
      /* the thing to grab answers a mouse: the raised shadow (hover is gated to a real pointer) */
      "hover:shadow-raised motion-shadow-fast",
      "motion-also-[scale_var(--fndn-duration-press)_var(--fndn-easing-out-strong)]",
      "[:root:not([data-fndn-input=keyboard])_&]:data-dragging:squeeze-press-sm",
      "pointer-coarse:after:content-[''] pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5",
    ],
  },
  variants: {
    size: {
      sm: { control: "h-[18px]", thumb: "size-3.5" },
      md: { control: "h-6", thumb: "size-5" },
    },
  },
  defaultVariants: { size: "md" },
});

export type SliderRecipeProps = VariantProps<typeof slider>;
