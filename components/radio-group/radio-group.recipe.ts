import { tv, type VariantProps } from "../lib/tv";
import { option } from "../lib/option";
import { glideLayer } from "../lib/glide";

/* radio-group — 16px round controls on the Zag radio-group machine.
 * Options are <label>s around a visually hidden native radio, so focus, arrow keys and the form
 * value are the browser's own. Like the checkbox, the text line is 18px and the control sits 1px
 * down: control and first text line share one centre line, and a wrapped label keeps it on line one.
 *
 * Parts are found by data-slot
 * (radio-group, radio-group-item, radio-group-control, …); the root slot is `base`. The control
 * also works written by hand in another option row (a menu radio item: menu imports this recipe):
 * it hovers and presses with whatever element holds it. */

const DIR = "[unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right";
const row = option();

/* an option; in a row the shared option row goes first, so all of this wins over it */
const ITEM = [
  "relative inline-flex items-start gap-2 min-w-0 max-w-full",
  "text-sm leading-[18px] text-ink-2 cursor-pointer select-none touch-manipulation [-webkit-touch-callout:none]",
  /* the input says it too: a row is in its ink before anything has written data-state on it */
  "data-[state=checked]:text-ink [&:has(>[data-slot=radio-group-input]:checked)]:text-ink hover:text-ink",
  /* keyboard changes are instant, the label colour included (the controls carry kbd-instant) */
  "motion-colors-fast kbd:duration-0",
  "data-disabled:opacity-50 data-disabled:cursor-default data-disabled:pointer-events-none",
];

export const radioGroup = tv({
  slots: {
    base: "flex flex-col items-start gap-2 min-w-0 max-w-full",
    label: ["basis-full min-w-0 mb-0.5 text-sm font-medium leading-[18px] text-ink wrap-anywhere", DIR],
    /* layout="row": the one glide layer (glideLayer of lib/glide.ts) that travels to the row under the pointer */
    highlight: glideLayer,
    item: ITEM,
    control: [
      "kbd-instant",
      "relative grid place-items-center shrink-0 size-4 my-px rounded-[50%] bg-transparent",
      "data-[state=checked]:bg-on-ink",
      /* One moving thing: the inset ring. Selected, it grows from a 1.5px line-strong hairline to a
       * 5px ink ring, so the 6px on-ink centre forms as the ring closes in. Deselected, it runs back
       * over `fast`: when the selection moves, the old option empties while the new one fills. */
      "[box-shadow:inset_0_0_0_1.5px_var(--fndn-line-strong)] data-[state=checked]:[box-shadow:inset_0_0_0_5px_var(--fndn-ink)]",
      "[@media(hover:hover)_and_(pointer:fine)]:[:hover>&[data-state=unchecked]]:[box-shadow:inset_0_0_0_1.5px_var(--fndn-ink-3)]",
      /* the centre's background only: the inherited text colour does not move here */
      "motion-shadow-fast-out motion-also-[background-color_var(--fndn-duration-fast)_ease] motion-transform-press",
      "data-[state=checked]:motion-shadow-base-out data-[state=checked]:motion-also-[background-color_var(--fndn-duration-base)_ease]",
      /* press: pointer only (Space also makes the label :active, and keyboard changes are instant);
       * the holder is the option, or the row a hand-written control sits in */
      "[:root:not([data-fndn-input=keyboard])_:active>&]:scale-press-sm",
      /* reduced motion: the ring keeps its width and only changes colour (two layers of equal width
       * interpolate colour alone); the hairline stays line-strong under the ink, so the band fades
       * as one colour */
      "motion-reduce:motion-shadow-fast motion-reduce:data-[state=checked]:motion-shadow-fast motion-reduce:data-[state=checked]:motion-also-[background-color_var(--fndn-duration-fast)_ease]",
      "motion-reduce:[box-shadow:inset_0_0_0_5px_transparent,inset_0_0_0_1.5px_var(--fndn-line-strong)]",
      "motion-reduce:data-[state=checked]:[box-shadow:inset_0_0_0_5px_var(--fndn-ink),inset_0_0_0_1.5px_var(--fndn-line-strong)]",
      "motion-reduce:[@media(hover:hover)_and_(pointer:fine)]:[:hover>&[data-state=unchecked]]:[box-shadow:inset_0_0_0_5px_transparent,inset_0_0_0_1.5px_var(--fndn-ink-3)]",
      "data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-accent data-focus-visible:outline-offset-2",
    ],
    itemText: ["min-w-0 wrap-anywhere text-start", DIR],
    /* the native radio: present for focus, keys and forms, never seen */
    input: "sr-only opacity-0 pointer-events-none",
    /* the free-text row ("Something else"): a row in the same list, under the same glide, with a
     * bare text field where the control and text would be */
    custom: [row.base(), "flex w-full cursor-text active:bg-transparent has-focus-visible:shadow-[inset_0_0_0_1px_var(--fndn-accent)]"],
    customInput: [
      "flex-1 min-w-0 m-0 p-0 border-0 bg-transparent text-ink outline-none",
      "[font-family:inherit] [font-size:inherit] [font-weight:inherit] [font-style:inherit] leading-[18px] tracking-[inherit]",
      "placeholder:text-ink-3",
      /* dir="auto": the text keeps its own direction; the alignment stays on the page's side */
      "[:dir(ltr)>&]:text-left [:dir(rtl)>&]:text-right",
      /* under 16px iOS zooms the page on focus */
      "pointer-coarse:text-[16px]",
    ],
  },
  variants: {
    orientation: {
      vertical: {},
      horizontal: { base: "flex-row flex-wrap items-center gap-x-4" },
    },
    /* row: a list. Each option fills a row and composes the shared option row (lib/option.ts:
     * metrics, radius, press); the text line stays 18px and the row pads it to the option height. Rows are always
     * stacked. */
    layout: {
      inline: {},
      row: {
        base: "relative flex-col flex-nowrap items-stretch gap-0",
        label: "px-2 mb-1",
        item: [
          row.base(), ...ITEM,
          "flex w-full py-[calc((var(--option-height,30px)_-_18px)/2)] text-dense",
          "pointer-coarse:py-[calc((max(40px,var(--option-height,30px))_-_18px)/2)] pointer-coarse:text-md",
        ],
      },
    },
  },
  defaultVariants: { orientation: "vertical", layout: "inline" },
});

export type RadioGroupRecipeProps = VariantProps<typeof radioGroup>;
