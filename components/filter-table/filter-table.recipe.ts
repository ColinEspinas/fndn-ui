import { tv, type VariantProps } from "../lib/tv";

/* filter-table — chips that directly filter a table. Its columns, rows and chips come from props
 * (filter-table.logic.ts); without them it is the built-in task table. The grid of the head and of
 * every row is --fndn-filter-cols (each column's share, set by the adapter from the columns), and the
 * table is at least --fndn-filter-min wide (105px a column, 420 at least). A column's type sets its
 * look: title, text, date, number, status, tag.
 * The chips are the real SegmentedControl (variant chips: one radio group, a sliding thumb, a
 * status dot and a count in each label), so they are a single tab stop and the arrow keys move
 * and select; `filters` is passed to it as className. A status cell is the real StatusPill (sm),
 * a tag cell the real Tag; "nothing matches" is the real EmptyState (`empty`, as className). The
 * built-in statuses are pill tones (to do: orange, in progress: blue, completed: green).
 *
 * The table card scrolls sideways when the table is wider than the card: a one-column grid as wide
 * as the table (at least the card), so the edge veils can share the table's area.
 *
 * Motion (`docs motion`):
 *   rows     a row that leaves gives its space back while it fades (grid rows 1fr → 0fr at
 *            duration.reveal easing.out-strong, opacity at duration.base, visibility at the end), so
 *            the rows below close the gap in the same motion; rows that return do the reverse. No
 *            stagger: the table is refiltered constantly. From the keyboard it is instant
 *            (kbd-instant). Not a disclosure, so it is not the collapsible.
 *   hover    a row's fill, instant both ways (as the other tables)
 * What stays in base.css: the @keyframes of the two edge veils. data-overflow is written by
 * filter-table.logic.ts (measured), not by the adapters, so it stays an attribute.
 * Parts rendered by other components are marked data-filter-table="filters|status|tag|empty". */

/* the grid lines: --_grid-line, set on the root */
export const filterTable = tv({
  slots: {
    base: "[--_grid-line:var(--fndn-line)] w-full max-w-[420px] min-w-0",
    /* on the SegmentedControl: the chip row reaches 4px past the card on each side, so its padding
     * (which keeps the focus ring and the thumb's shadow inside the scroller) does not indent the
     * first chip */
    filters: "mt-0 mb-1 -mx-1",
    card: [
      "@container grid grid-cols-[minmax(min-content,1fr)] grid-rows-[auto_auto]",
      "overflow-x-auto overscroll-x-contain rounded-card bg-surface shadow-card",
      "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-2",
      /* a table cut by the card's edge fades into the surface on the side it continues past (a mask
       * is ruled out: it would cut the card's shadow). Two sticky veils ride the card's edges over the
       * whole table; a scroll-driven timeline (no time involved) shows the end one at the start, both
       * in between, the start one at the end. The veils are armed only while the table overflows the
       * card (data-overflow, set by watchVeils in filter-table.logic.ts): a card that fits shows none, also
       * one that was scrolled and then grew to fit (Chromium keeps a timeline's last progress once
       * its scroll range is gone). Their keyframes are in base.css. */
      "before:content-[''] before:[grid-area:1/1/-1/2] before:sticky before:z-1 before:w-6 before:pointer-events-none before:opacity-0",
      "after:content-[''] after:[grid-area:1/1/-1/2] after:sticky after:z-1 after:w-6 after:pointer-events-none after:opacity-0",
      "before:[justify-self:start] before:start-0 before:bg-[linear-gradient(to_var(--_end,right),var(--fndn-surface),transparent)]",
      "after:[justify-self:end] after:end-0 after:bg-[linear-gradient(to_var(--_start,left),var(--fndn-surface),transparent)]",
      "rtl:[--_end:left] rtl:[--_start:right]",
      "data-overflow:supports-[animation-timeline:scroll()]:before:[animation-name:fndn-filter-table-veil-start] data-overflow:supports-[animation-timeline:scroll()]:after:[animation-name:fndn-filter-table-veil-end]",
      "supports-[animation-timeline:scroll()]:before:[animation-timing-function:linear] supports-[animation-timeline:scroll()]:after:[animation-timing-function:linear]",
      "supports-[animation-timeline:scroll()]:before:[animation-fill-mode:both] supports-[animation-timeline:scroll()]:after:[animation-fill-mode:both]",
      "supports-[animation-timeline:scroll()]:before:[animation-timeline:scroll(nearest_inline)] supports-[animation-timeline:scroll()]:after:[animation-timeline:scroll(nearest_inline)]",
    ],
    table: "[grid-area:1/1] min-w-(--fndn-filter-min,420px)",
    head: [
      "grid grid-cols-(--fndn-filter-cols)",
      "border-b border-b-(color:--_grid-line) text-dense font-medium text-ink-2",
    ],
    th: "min-w-0 px-3 py-2 border-e border-e-(color:--_grid-line) last:border-e-0 last:border-e-current overflow-hidden text-ellipsis whitespace-nowrap text-start",
    row: [
      "kbd-instant",
      "grid grid-rows-[0fr] opacity-0 invisible [&>*]:min-h-0 [&>*]:overflow-hidden",
      "motion-size-reveal motion-opacity-base motion-also-[visibility_var(--fndn-duration-reveal)]",
    ],
    cells: [
      "grid grid-cols-(--fndn-filter-cols)",
      /* the row hover is instant both ways (the tables' one hover) */
      "border-b border-b-(color:--_grid-line) text-sm hover:bg-hover",
    ],
    /* long names truncate at the end; the full value is in the title */
    cell: [
      "flex min-w-0 items-center px-3 py-2 border-e border-e-(color:--_grid-line) last:border-e-0 last:border-e-current text-ink-2",
      "[&>span:not([data-filter-table])]:min-w-0 [&>span:not([data-filter-table])]:overflow-hidden",
      "[&>span:not([data-filter-table])]:text-ellipsis [&>span:not([data-filter-table])]:whitespace-nowrap",
    ],
    /* on the StatusPill and on the Tag: either may run into the cell's end padding before it truncates */
    status: "max-w-[calc(100%+10px)]",
    tag: "max-w-[calc(100%+10px)]",
    /* on the EmptyState: it takes the card's width and stays in view while the table scrolls */
    empty: "[grid-area:2/1] sticky start-0 [justify-self:start] w-[100cqi]",
  },
  variants: {
    /* author text keeps its own direction (cut at its own end) while the layout follows the page */
    type: {
      title: { cell: "font-medium text-ink [&>span]:[unicode-bidi:plaintext] [&>span]:[text-align:match-parent]" },
      text: { cell: "[&>span]:[unicode-bidi:plaintext] [&>span]:[text-align:match-parent]" },
      date: { cell: "whitespace-nowrap tabular-nums" },
      number: { th: "text-end", cell: "justify-end whitespace-nowrap tabular-nums" },
      /* the sm pill is 22px, the Tag 24px: a status row keeps the 40px of a tag row, so rows and
       * baselines do not move with the column type */
      status: { cell: "min-h-10" },
      tag: {},
    },
    /* the row matches the filter */
    shown: { true: { row: "grid-rows-[1fr] opacity-100 visible" } },
    /* "nothing matches" (a row) keeps the table's own breathing room; no rows at all is a block */
    empty: {
      row: { empty: "py-5" },
      block: {},
    },
  },
});

export type FilterTableRecipeProps = VariantProps<typeof filterTable>;
