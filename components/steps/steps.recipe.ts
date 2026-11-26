import { tv, type VariantProps } from "../lib/tv";

/* steps — a multi-step flow (Zag steps through Ark UI): numbered markers joined by a rail.
 *
 * The model is the task rows (task-rows.recipe.ts): the 24px badge column, the completed mark (green
 * fill, white check that arrives scaled from 0.5 with its opacity, at the press timing), the 1px
 * rail in the line colour (w-px in the 24px column: its middle is 11.5px in), and the step
 * figure's 10.5px/600 tabular type. The markers' states come from the engine's attributes
 * (data-incomplete, data-current, data-complete) on the item's parts.
 *
 *   horizontal  markers in a row of equal columns, each step's text under its marker (it wraps in
 *               its column); the rail runs from this marker to the next at the markers' middle
 *   vertical    the rail runs down the marker column, from under the marker to the next one
 *
 * Motion: colours over duration.base; the check scales and fades in, and fades out faster; all instant from the
 * keyboard (kbd-instant on every part that moves). Transitions only, so nothing plays on first
 * paint. The trigger bleeds 6px (padding and negative margin) so the marker lines up with the
 * edge while the hover fill has room. Back and Next are the real Button, marked data-steps.
 * Parts are found by data-slot (steps, steps-list, steps-item, …). */

export const steps = tv({
  slots: {
    base: "flex w-full min-w-0 flex-col gap-4",
    list: "flex min-w-0",
    item: "flex min-w-0",
    trigger: [
      "flex min-w-0 items-start gap-2.5 -m-1.5 p-1.5 rounded-control text-start",
      "motion-colors-fast kbd:duration-0",
    ],
    indicator: [
      "kbd-instant",
      "grid shrink-0 size-6 place-items-center rounded-[50%] border border-solid [&>*]:[grid-area:1/1]",
      "border-line-strong bg-transparent text-ink-2 motion-colors-base",
      "data-current:border-ink data-current:bg-ink data-current:text-on-ink",
      "data-complete:border-green data-complete:bg-green data-complete:text-on-accent",
    ],
    number: [
      "kbd-instant",
      "text-[10.5px] font-semibold leading-none tabular-nums opacity-100 motion-opacity-base",
      "[[data-slot=steps-indicator][data-complete]>&]:opacity-0",
    ],
    /* in: scaled from 0.5 with its opacity (the task rows' mark). Out (a step undone by Back or an
     * earlier marker): shorter and simpler, it fades over `fast` and its scale resets once the fade
     * is over. Reduced motion: no scale, the check fades both ways. */
    check: [
      "kbd-instant",
      "flex text-[13px] opacity-0 [transform:scale(0.5)] motion-reduce:[transform:none]",
      "[transition:opacity_var(--fndn-duration-fast)_ease,transform_0ms_linear_var(--fndn-duration-fast)]",
      "[[data-slot=steps-indicator][data-complete]>&]:opacity-100 [[data-slot=steps-indicator][data-complete]>&]:[transform:none]",
      "[[data-slot=steps-indicator][data-complete]>&]:motion-opacity-base [[data-slot=steps-indicator][data-complete]>&]:motion-transform-press",
    ],
    text: "flex min-w-0 flex-col",
    title: [
      "text-sm font-medium leading-normal text-ink-2 wrap-break-word [unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
      "[[data-slot=steps-trigger]:is([data-current],[data-complete])_&]:text-ink",
    ],
    description: "text-xs leading-normal text-ink-2 wrap-break-word [unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
    separator: "kbd-instant w-px h-px shrink-0 bg-line motion-colors-base data-complete:bg-green",
    content: "text-sm leading-normal text-ink-2 wrap-break-word [unicode-bidi:plaintext]",
    completed: "text-sm leading-normal text-ink-2 wrap-break-word [unicode-bidi:plaintext]",
    footer: "flex flex-wrap items-center justify-end gap-2",
  },
  variants: {
    orientation: {
      horizontal: {
        /* equal columns; the text sits under its marker, so a long title wraps in its own column
         * and a crowded row never squeezes a neighbour */
        list: "items-start",
        item: "relative flex-1 basis-0 flex-col",
        trigger: "flex-col max-w-full gap-1.5",
        title: "wrap-anywhere",
        description: "wrap-anywhere",
        /* from 6px after this marker to 6px before the next one, at the marker's middle */
        separator: "absolute top-[11.5px] start-[30px] end-1.5 w-auto",
      },
      vertical: {
        list: "flex-col",
        item: "relative flex-col pb-5 last:pb-0",
        /* beside the marker, the title's first line is the marker's 24px line (horizontal: under
         * the marker, every line keeps the body leading) */
        title: "first-line:leading-6",
        /* the fill bleeds at the start only, so the row ends on the list's edge */
        trigger: "me-0",
        /* down the marker column: from 4px under this marker to 4px above the next one (12px of
         * rail between two steps without a description) */
        separator: "absolute start-[11.5px] top-7 bottom-1 h-auto",
      },
    },
    /* not linear: a marker is pressable (a row's press: background only) */
    linear: {
      false: { trigger: "cursor-pointer hover:bg-hover active:bg-hover-2" },
      true: { trigger: "cursor-default" },
    },
  },
  defaultVariants: { orientation: "horizontal", linear: false },
});

export type StepsRecipeProps = VariantProps<typeof steps>;
