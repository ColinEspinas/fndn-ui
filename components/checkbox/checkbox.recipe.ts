import { tv, type VariantProps } from "../lib/tv";
import { option } from "../lib/option";

/* checkbox — 16px box on the Zag checkbox machine (data-state=checked|unchecked|indeterminate).
 * The root is a <label>, so the text is part of the hit area; a visually hidden native checkbox
 * carries focus, Space and the form value. The label line is 18px and the box sits 1px down,
 * so box and first text line share one centre line, and a wrapped label keeps the box on line one.
 *
 * Parts are found by data-slot
 * (checkbox, checkbox-control, checkbox-mark, checkbox-label, checkbox-input); the root slot is
 * `base`. The two marks are told apart by data-mark (check | indeterminate). The control also works
 * outside the label, written by hand in an option row (a menu checkbox item: menu imports this
 * recipe): it hovers and presses with whatever element holds it. */

/* the label; in a row the shared option row goes first, so all of this wins over it */
const BASE = [
  "relative inline-flex items-start gap-2 min-w-0 max-w-full text-sm leading-[18px] text-ink cursor-pointer",
  "select-none touch-manipulation [-webkit-touch-callout:none]",
  "data-disabled:opacity-50 data-disabled:cursor-default data-disabled:pointer-events-none",
];

export const checkbox = tv({
  slots: {
    base: BASE,
    /* a box with no visible label still gets a 24px target (::after) */
    control: [
      "kbd-instant",
      "relative grid place-items-center shrink-0 size-4 my-px rounded-[5px] bg-transparent text-on-ink",
      "shadow-[inset_0_0_0_1.5px_var(--fndn-line-strong)]",
      "after:content-[''] after:absolute after:-inset-1",
      "[@media(hover:hover)_and_(pointer:fine)]:[:hover>&[data-state=unchecked]]:shadow-[inset_0_0_0_1.5px_var(--fndn-ink-3)]",
      "data-invalid:data-[state=unchecked]:shadow-[inset_0_0_0_1.5px_var(--fndn-red)]",
      "data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-accent data-focus-visible:outline-offset-2",
      /* the fill leads: colour over `fast`, both ways. Press: pointer only (Space also makes the
       * label :active, and keyboard changes are instant). The holder is the label, or the option row
       * a hand-written control sits in. */
      "motion-colors-fast motion-shadow-fast motion-transform-press",
      "[:root:not([data-fndn-input=keyboard])_:active>&]:scale-press-sm",
    ],
    /* both marks share the box's one grid cell; the control's state picks the one that shows */
    mark: [
      "kbd-instant",
      "[grid-area:1/1] inline-flex text-[12px]",
      /* On: the mark is drawn, not popped. A clip-path wipe (the check from the inline start, the
       * dash from its centre) starts one stagger step after the fill, so the fill leads and the mark
       * lands on ink. Off: shorter and simpler, the mark fades over `fast` while the box empties; the
       * clip resets only once the fade is over, so an interrupted toggle retargets from where it is.
       * Keyboard changes are instant: kbd-instant zeroes the durations and delays. */
      "opacity-0 [clip-path:inset(0_100%_0_0)] data-[mark=indeterminate]:[clip-path:inset(0_50%)]",
      "[transition:opacity_var(--fndn-duration-fast)_ease,clip-path_0ms_linear_var(--fndn-duration-fast)]",
      "[[data-state=checked]>&[data-mark=check]]:opacity-100 [[data-state=checked]>&[data-mark=check]]:[clip-path:inset(0)] [[data-state=checked]>&[data-mark=check]]:[transition:opacity_0ms_linear,clip-path_var(--fndn-duration-base)_var(--fndn-easing-out-strong)_var(--fndn-duration-stagger)] [[data-state=indeterminate]>&[data-mark=indeterminate]]:opacity-100 [[data-state=indeterminate]>&[data-mark=indeterminate]]:[clip-path:inset(0)] [[data-state=indeterminate]>&[data-mark=indeterminate]]:[transition:opacity_0ms_linear,clip-path_var(--fndn-duration-base)_var(--fndn-easing-out-strong)_var(--fndn-duration-stagger)]",
      /* reduced motion: no wipe; the mark fades over `fast` both ways (the old one drops faster, so
       * a check/dash swap does not read as two marks) */
      "motion-reduce:[clip-path:none] motion-reduce:data-[mark=indeterminate]:[clip-path:none] motion-reduce:[transition:opacity_var(--fndn-duration-fast)_ease]",
      "[[data-state=checked]>&[data-mark=check]]:motion-reduce:[clip-path:none] [[data-state=checked]>&[data-mark=check]]:motion-reduce:[transition:opacity_var(--fndn-duration-fast)_ease] [[data-state=indeterminate]>&[data-mark=indeterminate]]:motion-reduce:[clip-path:none] [[data-state=indeterminate]>&[data-mark=indeterminate]]:motion-reduce:[transition:opacity_var(--fndn-duration-fast)_ease]",
    ],
    /* author text reads in its own direction; the alignment stays on the page's side */
    label: "min-w-0 [overflow-wrap:anywhere] [unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
    /* the native checkbox: present for focus, keys and forms, never seen (sr-only does the hiding) */
    input: "sr-only opacity-0 pointer-events-none",
  },
  variants: {
    /* md: an 18px box for table rows (the label line stays 18px, so the box needs no offset) */
    size: {
      sm: {},
      md: { control: "size-[18px] my-0" },
    },
    /* the checked (and indeterminate) fill; red and green carry the on-accent mark, white in both themes */
    tone: {
      ink: {
        control: [
          "data-[state=checked]:bg-ink data-[state=checked]:shadow-[inset_0_0_0_1.5px_var(--fndn-ink)]",
          "data-[state=indeterminate]:bg-ink data-[state=indeterminate]:shadow-[inset_0_0_0_1.5px_var(--fndn-ink)]",
        ],
      },
      red: {
        control: [
          "data-[state=checked]:bg-red data-[state=checked]:shadow-[inset_0_0_0_1.5px_var(--fndn-red)] data-[state=checked]:text-on-accent",
          "data-[state=indeterminate]:bg-red data-[state=indeterminate]:shadow-[inset_0_0_0_1.5px_var(--fndn-red)] data-[state=indeterminate]:text-on-accent",
        ],
      },
      green: {
        control: [
          "data-[state=checked]:bg-green data-[state=checked]:shadow-[inset_0_0_0_1.5px_var(--fndn-green)] data-[state=checked]:text-on-accent",
          "data-[state=indeterminate]:bg-green data-[state=indeterminate]:shadow-[inset_0_0_0_1.5px_var(--fndn-green)] data-[state=indeterminate]:text-on-accent",
        ],
      },
    },
    /* row: the checkbox fills a list row. The root composes the shared option row (recipe
     * `option`: metrics, radius, press); the list owns the one glide layer. The text line stays 18px and the row pads it
     * to the option height, so a wrapped label keeps the box on line one. */
    layout: {
      inline: {},
      row: {
        base: [
          option().base(), ...BASE,
          "flex w-full max-w-none text-dense py-[calc((var(--option-height,30px)_-_18px)_/_2)]",
          "pointer-coarse:text-md pointer-coarse:py-[calc((max(40px,var(--option-height,30px))_-_18px)_/_2)]",
        ],
      },
    },
  },
  defaultVariants: { size: "sm", tone: "ink", layout: "inline" },
});

export type CheckboxRecipeProps = VariantProps<typeof checkbox>;
