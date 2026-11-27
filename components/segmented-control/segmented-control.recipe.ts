import { tv, type VariantProps } from "../lib/tv";

/* segmented-control — a switcher on the radio-group engine, in the app's shape (a pill unless the
 * app is rounded).
 * The track is on the one control height scale: an sm segmented control lines up with
 * an sm Button or Select. Segments are the track less its 2px padding. Size changes dimensions
 * only; every size has the same track, thumb and focus.
 *   xs            24px track · 20px segments · 12px   (the compact switcher)
 *   sm            28px track · 24px segments · 12px
 *   md (default)  32px track · 28px segments · 13px
 *   lg            36px track · 32px segments · 14px
 *   chips         separate 26px chips with a gap and no track, for a filter row (size does not apply)
 * Segments are <label>s around a visually hidden native radio, so focus, arrow keys and the form
 * value are the browser's own. The track has no height of its own: segments set it, the track adds
 * 2px of padding. That is what keeps icon cells centred on the thumb. Labels are always whole: when
 * the options do not fit, the engine glue sets data-overflow and the row scrolls sideways.
 *
 * Everything is here, motion included. Parts are found by data-slot (segmented-control,
 * segmented-control-thumb, -option, -label, -dot, -input); the root slot is `base`. data-overflow
 * is written by the engine glue (segmented-control.logic.ts), data-overflow-start and
 * data-overflow-end by watchVeils (lib/veil.ts), not by the adapters, so they stay attributes. */

/* The edge veils of an overflowing row (segments only: chips have no track). The edge the row
 * continues past fades into the track, so an option cut by the edge never reads as a stray letter:
 * two sticky veils ride the scroller's edges, each shown while there is more on its side, at once
 * (no time involved): data-overflow-start and data-overflow-end follow the scroll position (as in
 * selection-actions). Each nets to nothing in the row (16px minus the 2px padding it reaches into minus
 * 14px): the options do not move. Without data-overflow none of this applies. */
const VEILS = [
  "data-overflow:[&:dir(rtl)]:[--_end:left] data-overflow:[&:dir(rtl)]:[--_start:right]",
  "data-overflow:before:content-[''] data-overflow:before:sticky data-overflow:before:z-3 data-overflow:before:flex-[0_0_16px] data-overflow:before:-my-0.5 data-overflow:before:pointer-events-none data-overflow:before:opacity-0",
  "data-overflow:after:content-[''] data-overflow:after:sticky data-overflow:after:z-3 data-overflow:after:flex-[0_0_16px] data-overflow:after:-my-0.5 data-overflow:after:pointer-events-none data-overflow:after:opacity-0",
  "data-overflow:before:start-0 data-overflow:before:ms-[-2px] data-overflow:before:me-[-14px] data-overflow:before:rounded-s-(--_radius) data-overflow:before:bg-[linear-gradient(to_var(--_end,right),var(--_veil),transparent)]",
  "data-overflow:after:end-0 data-overflow:after:ms-[-14px] data-overflow:after:me-[-2px] data-overflow:after:rounded-e-(--_radius) data-overflow:after:bg-[linear-gradient(to_var(--_start,left),var(--_veil),transparent)]",
  "data-overflow:data-overflow-start:before:opacity-100 data-overflow:data-overflow-end:after:opacity-100",
];

/* until the thumb is measured (first paint, server render) the selected segment paints itself
 * exactly like the thumb, so the hand-over is invisible */
const UNMEASURED = "[[data-slot=segmented-control-thumb][hidden]~&]:data-[state=checked]";

export const segmentedControl = tv({
  slots: {
    /* --_radius: the track's radius, the app's shape unless `shape` names one; the overflow veils
     * read it too. --_thumb-radius: the thumb's, concentric (the track's less the 2px padding) */
    base: [
      "relative inline-flex items-stretch max-w-full p-0.5 bg-field select-none",
      "[--_radius:var(--fndn-radius-shape)] [--_thumb-radius:calc(var(--_radius)-2px)] rounded-(--_radius)",
    ],
    /* the engine's indicator: it hands the thumb its box as --left / --top / --width / --height and
     * switches the transition on only while a selection is being made (no slide on mount, none when
     * fonts load or the container resizes). We choose what travels: transform instead of left (the
     * engine's inline `left: var(--left)` is overridden: offsets are physical, also right-to-left).
     * width travels too: the thumb is childless and scaleX would distort its radius.
     * Its paint lives on ::before, so pressing the selected segment scales the paint while the
     * engine keeps the thumb's own transition off at rest. */
    thumb: [
      "kbd-instant",
      "absolute top-0 [left:0]! w-(--width) h-(--height) rounded-(--_thumb-radius) pointer-events-none",
      "[transform:translate(var(--left,0px),var(--top,0px))]",
      "[--transition-property:transform,width]! [--transition-duration:var(--fndn-duration-move)] [--transition-timing-function:var(--fndn-easing-move)]",
      "before:absolute before:inset-0 before:rounded-[inherit] before:bg-surface before:shadow-btn",
      "before:motion-transform-press [[data-slot=segmented-control]:has(>[data-slot=segmented-control-option][data-state=checked]:active)>&]:before:squeeze-press",
    ],
    /* press: no background (a grey block under the pressed segment would vanish on release while
     * the thumb is still on its way). The label goes to ink and the segment gives a little. */
    option: [
      "relative z-1 inline-flex items-center justify-center gap-1 shrink-0",
      "rounded-(--_thumb-radius) font-medium leading-none whitespace-nowrap text-ink-2",
      "cursor-pointer touch-manipulation [-webkit-touch-callout:none]",
      "motion-colors-base motion-transform-press kbd:duration-0",
      "hover:text-ink active:text-ink active:squeeze-press data-[state=checked]:text-ink",
      `${UNMEASURED}:bg-surface ${UNMEASURED}:shadow-btn`,
      "data-focus-visible:z-2 data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-accent data-focus-visible:outline-offset-2",
      "data-disabled:opacity-50 data-disabled:cursor-default data-disabled:pointer-events-none",
    ],
    /* never cut (the row scrolls instead); keeps its own direction on either page */
    label: "[unicode-bidi:plaintext]",
    /* status dot in a label: 6px, coloured by tone (the tag hues; none = ink-3) */
    dot: "shrink-0 size-1.5 rounded-[50%] bg-ink-3",
    /* the native radio: present for focus, keys and forms, never seen */
    input: "sr-only opacity-0 pointer-events-none",
  },
  variants: {
    /* dimensions only: the segment's height (the track adds its 2px padding), padding, text, icon */
    size: {
      xs: { base: "[--_radius:var(--fndn-radius-shape-sm)]", option: "h-5 px-2 text-xs [&>[data-slot=icon]]:text-[12px]" },
      sm: { base: "[--_radius:var(--fndn-radius-shape-sm)]", option: "h-6 px-2.5 text-xs [&>[data-slot=icon]]:text-[13px]" },
      md: { option: "h-7 px-3 text-sm [&>[data-slot=icon]]:text-[14px]" },
      lg: { option: "h-8 px-3.5 text-md [&>[data-slot=icon]]:text-[16px]" },
    },
    /* named, it is that shape whatever the app's */
    shape: {
      pill: { base: "[--_radius:var(--fndn-radius-pill)]" },
      rounded: { base: "[--_radius:var(--fndn-radius-control)]" },
    },
    /* equal-width segments sharing the root's width; a segment never gets narrower than its label */
    fill: {
      true: { base: "inline-grid grid-flow-col auto-cols-[minmax(max-content,1fr)]" },
    },
    /* square cells as tall as the segment; the label stays only as the accessible name */
    icons: {
      true: { option: "px-0", label: "sr-only" },
    },
    variant: {
      /* overflow (data-overflow, set by the engine glue): the row scrolls sideways with no
       * scrollbar; the focus ring moves onto the option's edge so the scroller does not clip it */
      segments: {
        base: [
          ...VEILS,
          /* the veil is the track's colour */
          "data-overflow:[--_veil:var(--fndn-field)]",
          "data-overflow:overflow-x-auto data-overflow:overflow-y-hidden data-overflow:overscroll-x-contain",
          "data-overflow:[scrollbar-width:none] data-overflow:[&::-webkit-scrollbar]:hidden",
        ],
        option: "[[data-slot=segmented-control][data-overflow]>&]:data-focus-visible:outline-offset-0",
      },
      /* the one thumb still slides between the chips; the 4px padding keeps the focus ring and the
       * thumb's shadow (3px below it) inside the scroller. The label holds a dot, the text and a count.
       * Overflowing, the edge the row continues past fades out: a mask, not a veil, because the row
       * has no colour of its own to fade into. Each side's fade is 16px while there is more on that
       * side (data-overflow-start, data-overflow-end: the scroll position, at once, no time
       * involved), the room revealSelected keeps clear; 0px otherwise. */
      chips: {
        base: [
          "flex gap-1 p-1 bg-transparent overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[&:dir(rtl)]:[--_end:left]",
          "data-overflow:[mask-image:linear-gradient(to_var(--_end,right),transparent,#000_var(--_fade-start,0px),#000_calc(100%_-_var(--_fade-end,0px)),transparent)]",
          "data-overflow-start:[--_fade-start:16px] data-overflow-end:[--_fade-end:16px]",
        ],
        thumb: "before:shadow-btn",
        option: ["shrink-0 h-[26px] px-2.5 gap-1.5 text-xs", `${UNMEASURED}:shadow-btn`],
        label: "inline-flex items-center gap-1.5 overflow-visible",
      },
    },
    tone: {
      none: {},
      blue: { dot: "bg-tag-blue" },
      green: { dot: "bg-tag-green" },
      orange: { dot: "bg-tag-orange" },
      red: { dot: "bg-tag-red" },
      purple: { dot: "bg-tag-purple" },
      cyan: { dot: "bg-tag-cyan" },
      yellow: { dot: "bg-tag-yellow" },
      pink: { dot: "bg-tag-pink" },
    },
  },
  compoundVariants: [
    /* icon-only: square cells as tall as the segment */
    { icons: true, size: "xs", class: { option: "w-5" } },
    { icons: true, size: "sm", class: { option: "w-6" } },
    { icons: true, size: "md", class: { option: "w-7" } },
    { icons: true, size: "lg", class: { option: "w-8" } },
    { icons: true, fill: true, class: { option: "w-auto" } },
    /* a control that fills its row is a grid of equal columns; scrolling, it is a row again (the
     * options at their own width, the veils at theirs). Only here does a state set the display:
     * elsewhere the display stays the app's to set (a class that hides the control keeps it hidden) */
    { variant: "segments", fill: true, class: { base: "data-overflow:inline-flex" } },
    /* rounded takes the radius of a field of the same height: chip up to 28px, control from 32px */
    { shape: "rounded", size: ["xs", "sm"], class: { base: "[--_radius:var(--fndn-radius-chip)]" } },
  ],
  defaultVariants: { size: "md", variant: "segments", tone: "none" },
});

export type SegmentedControlRecipeProps = VariantProps<typeof segmentedControl>;
