import { tv, type VariantProps } from "../lib/tv";

/* calendar — a month grid on the Zag date-picker machine (through Ark UI), shown on its own
 * (inline) or inside the date picker's popup. Three views share one box: days (7 columns, six
 * weeks), months and years (4 columns). The box keeps one size across months and views, so
 * paging never moves what sits around it: 224px wide (seven 32px days), the day grid 24px of
 * weekday names plus six 32px weeks; on coarse pointers 40px days.
 *
 * Header: the pager's controls: previous and next are the real Button (ghost, sm, square, muted),
 * marked data-calendar="prev|next"; the title between them is a ghost Button too (data-calendar=
 * "title"), which switches to the month, then the year view. The carets mirror right-to-left.
 *
 * A date (the cell trigger, written by the engine: data-selected, data-today, data-in-range,
 * data-outside-range, data-unavailable, data-disabled, data-focus):
 *   hover          color.hover (gated to a real pointer)
 *   selected       ink fill, on-ink text: never the hover's colour
 *   range          the band (color.hover-2) is painted on the cell behind the dates, rounded at the
 *                  range's ends and at the ends of each week; its two ends are selected dates.
 *                  While the second end is being chosen, the band under the pointer is color.hover.
 *                  The band changes colour over duration.fast, as the dates do.
 *   today          a 4px dot under the number (a shape, not a colour), aria-current="date"
 *   other month    ink-3, not selectable
 *   unavailable    ink-3 and struck through (min / max, and the caller's unavailable days)
 *   focus          the global focus ring (base.css), drawn inside the date (the dates touch, as a
 *                  table's cells do); arrow keys move it at once
 * A press scales the date from the pointer only; Space and Enter act at once (kbd-instant).
 * Paging and switching views are instant: nothing slides. */

export const calendar = tv({
  slots: {
    base: "inline-flex flex-col min-w-0 max-w-full data-disabled:opacity-50",
    /* the engine's content element (role=application, named by the calendar's aria-label); in the
     * date picker, the popup is this element */
    content: "outline-none",
    /* one view at a time (the engine sets hidden on the others) */
    view: "flex flex-col gap-2 w-56 pointer-coarse:w-70 [&[hidden]]:hidden",
    header: "flex items-center justify-between gap-1",
    /* passed to the Buttons as className, after their own classes */
    prev: "[&:dir(rtl)_[data-slot=icon]]:[transform:scaleX(-1)]",
    next: "[&:dir(rtl)_[data-slot=icon]]:[transform:scaleX(-1)]",
    /* the month is the heading: sm / medium ink. In the year view there is no further view, so
     * the engine disables it; it then reads as plain text, not as a half-faded control */
    title: "min-w-0 text-sm font-medium [unicode-bidi:isolate] disabled:opacity-100",
    grid: [
      "w-full table-fixed border-separate border-spacing-0 outline-none",
      /* months and years fill the day grid's height */
      "data-[view=month]:h-[216px] data-[view=year]:h-[216px]",
      "pointer-coarse:data-[view=month]:h-[264px] pointer-coarse:data-[view=year]:h-[264px]",
    ],
    head: "",
    weekday: "h-6 p-0 text-center align-middle text-2xs font-normal text-ink-2 whitespace-nowrap",
    body: "",
    row: "",
    /* the cell carries the range band, so it runs unbroken from one end to the other; the band
     * changes colour with the dates it holds (duration.fast), at once from the keyboard */
    cell: [
      "kbd-instant",
      "p-0 text-center align-middle motion-colors-fast",
      "first:rounded-s-chip last:rounded-e-chip",
      "[&:has(>[data-in-range]:not([data-in-hover-range]))]:bg-hover-2 [&:has(>[data-in-hover-range])]:bg-hover",
      "[&:has(>[data-range-start])]:rounded-s-chip [&:has(>[data-range-end])]:rounded-e-chip",
      "[&:has(>[data-hover-range-start])]:rounded-s-chip [&:has(>[data-hover-range-end])]:rounded-e-chip",
    ],
    cellTrigger: [
      "kbd-instant",
      "relative flex items-center justify-center mx-auto size-8 pointer-coarse:size-10 rounded-chip",
      "text-dense leading-none text-ink tabular-nums cursor-pointer select-none",
      "data-[view=month]:w-full data-[view=month]:h-10 data-[view=year]:w-full data-[view=year]:h-10",
      "motion-colors-fast motion-transform-press [:root:not([data-fndn-input=keyboard])_&:active]:scale-press",
      /* dates touch: the ring is drawn inside the date, as on a table's cells, never over its neighbour */
      "focus-visible:-outline-offset-2",
      "hover:bg-hover",
      "data-selected:bg-ink data-selected:text-on-ink data-selected:font-medium hover:data-selected:bg-ink",
      /* today: a dot under the number, in the number's colour */
      "data-today:after:absolute data-today:after:inset-x-0 data-today:after:bottom-1 data-today:after:mx-auto data-today:after:size-1 data-today:after:rounded-full data-today:after:bg-current",
      "data-outside-range:text-ink-3",
      "data-unavailable:text-ink-3 data-unavailable:line-through",
      "data-disabled:cursor-default data-disabled:pointer-events-none",
    ],
  },
});

export type CalendarRecipeProps = VariantProps<typeof calendar>;
