import { tv, type VariantProps } from "../lib/tv";

/* switch — a native button with role=switch. State lives in aria-checked, so the same markup works
 * in every target.   md 40×24 · 20px thumb     sm 32×18 · 14px thumb
 *
 * Everything is here, motion included: the track's colour, the thumb's travel on `translate` and its
 * squeeze on `scale` (two properties, so each keeps its own timing: travel is on-screen movement,
 * the squeeze is press feedback). Parts are found by data-slot (switch, switch-thumb, switch-label,
 * switch-label-text); the root slot is `base`. */

/* `switch` is a reserved word, hence the name */
export const switchRecipe = tv({
  slots: {
    base: [
      "relative inline-block shrink-0 rounded-pill bg-line-strong",
      "aria-checked:bg-ink",
      "hover:bg-[color-mix(in_oklch,var(--fndn-line-strong)_70%,var(--fndn-ink-3))] aria-checked:hover:bg-ink aria-checked:hover:opacity-90",
      "disabled:opacity-50 disabled:cursor-default disabled:pointer-events-none",
      "aria-disabled:opacity-50 aria-disabled:cursor-default aria-disabled:pointer-events-none",
      /* the track and the thumb answer a key together: both instant */
      "motion-colors-base motion-opacity-base kbd-instant",
    ],
    /* right-to-left the switch mirrors: off at the right, on at the left. on-ink keeps the thumb
     * visible in both themes (in dark mode the track is near white). */
    thumb: [
      "kbd-instant",
      "absolute top-0.5 start-0.5 rounded-[50%] bg-on-accent shadow-[0_1px_2px_oklch(0_0_0/0.2)]",
      "[[data-slot=switch][aria-checked=true]_&]:bg-on-ink",
      "motion-colors-base motion-transform-glide motion-also-[scale_var(--fndn-duration-press)_var(--fndn-easing-out-strong)]",
      /* press: the small-control token, pointer only (Space and Enter also make the button :active,
       * and keyboard changes are instant), like the checkbox box and the radio */
      "[:root:not([data-fndn-input=keyboard])_[data-slot=switch]:active_&]:squeeze-press-sm",
    ],
    /* optional label wrapper: the text is part of the hit area and names the switch. The label line
     * is 18px, padded to the switch's height, so the switch and the first text line share one
     * centre line and a wrapped label keeps the switch on line one (as the checkbox and the radio do). */
    label: [
      "inline-flex items-start gap-2 min-w-0 max-w-full text-sm leading-[18px] text-ink cursor-pointer",
      "select-none touch-manipulation [-webkit-touch-callout:none] has-[>[data-slot=switch]:disabled]:cursor-default",
    ],
    /* author text reads in its own direction; the alignment stays on the page's side */
    labelText: [
      "min-w-0 [overflow-wrap:anywhere] py-[3px] [unicode-bidi:plaintext]",
      "[&:dir(ltr)]:text-left [&:dir(rtl)]:text-right [[data-slot=switch]:disabled+&]:text-ink-3",
    ],
  },
  variants: {
    size: {
      /* the thumb travels the track less its own width and the two 2px insets; mirrored right-to-left */
      sm: {
        base: "w-8 h-[18px]",
        thumb: "size-3.5 [[data-slot=switch][aria-checked=true]_&]:translate-x-3.5 [[data-slot=switch][aria-checked=true]:dir(rtl)_&]:-translate-x-3.5",
        labelText: "py-0",
      },
      md: { base: "w-10 h-6", thumb: "size-5 [[data-slot=switch][aria-checked=true]_&]:translate-x-4 [[data-slot=switch][aria-checked=true]:dir(rtl)_&]:-translate-x-4" },
    },
  },
  defaultVariants: { size: "md" },
});

export type SwitchRecipeProps = VariantProps<typeof switchRecipe>;
