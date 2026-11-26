import { tv, type VariantProps } from "../lib/tv";

/* table — a plain data table in the records table's look (records-table.recipe.ts): one quiet surface
 * card, 35px rows, precise rules between rows and columns (the line colour), text-dense/500
 * ink-2 header labels over 13px/500 ink values. Static parts: the root is the card and the sideways
 * scroller, then the <table>, its row groups, rows, head cells, cells and caption.
 *
 * Differences from the records table, on purpose: values wrap instead of being cut (a plain table
 * has no title on its cells and no column menu to widen a column), so a row is 35px at least,
 * not exactly; header labels and values share one inline start (12px in).
 *
 * The rules are the cells' own borders (separate borders, no spacing), so a row's hover fill and
 * the card's radius never fight over a collapsed border. The body row's hover is instant both
 * ways, as the records table's: rows are functional data. No motion; the edge veils of a table
 * wider than its card follow the scroll position, not time. Parts are found by data-slot
 * (table, table-table, table-header, …); the root slot is `base`.
 *
 * flush (variant): a list of records inside a pane (an issue list, a file list, Linear's and
 * GitHub's issue rows): no card (no surface, shadow or radius), no rules between columns, a hairline
 * between rows only, and every cell on one line (nowrap): a row is exactly 35px. The column that
 * gives way is the one marked `truncate` (a title: free text), which takes the room left and is cut
 * at its end with a title (lib/truncate.ts); names of choices and numbers stay whole, and when even
 * they do not fit the table scrolls sideways (no veils in flush: there is no card surface to fade
 * into; the scrollbar shows). The look is carried to the parts by two private properties set on
 * the root (--_col-line, the column rule's colour; --_ws, the cells' white-space), so the static
 * parts need no prop of their own.
 *
 * loading: placeholder rows (`skeleton`, a still bar in hover-2 per cell, its width varying by
 * column) while the data is on its way, aria-busy on the <table>. Still on purpose: a table is a
 * high-frequency surface and a shimmer across every row is noise (the Shimmer is for a label). */

/* the rules shared by head cells and cells: under each, and at the inline end but for the last column */
const GRID_CELL = [
  "border-b border-e border-solid border-b-(color:--_grid-line) border-e-(color:--_col-line,var(--_grid-line))",
  "last:border-e-0 align-middle [unicode-bidi:plaintext] [white-space:var(--_ws,normal)]",
].join(" ");

export const table = tv({
  slots: {
    /* the card scrolls sideways; a wheel at an end goes on to the page. In a flex or grid parent
     * min-w-0 and the scroller keep its width from pushing the parent wider. No inline-size
     * containment: inside a shrink-to-fit parent (a centring stage, a popover) it left the table
     * with no width of its own, 0px and invisible; there it takes its
     * content's width, as any block does */
    base: [
      "relative w-full min-w-0 overflow-x-auto overscroll-x-contain rounded-card bg-surface shadow-card",
      "[--_grid-line:var(--fndn-line)]",
      "[scrollbar-color:var(--fndn-line-strong)_transparent] [scrollbar-width:thin]",
      "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2",
      /* a table cut by the card's edge fades into the surface on the side it continues past, as the
       * records and filter tables do (a thin or overlay scrollbar is no cue; a mask is ruled out: it
       * would cut the card's shadow). The card is a one-column grid as wide as the table (at least
       * the card), so two sticky veils share the table's area and ride the card's edges; a
       * scroll-driven timeline (no time involved) shows the end one at the start, both in between,
       * the start one at the end. They are armed only while the table overflows (data-overflow,
       * measured by watchVeils): a card that fits shows none. Their keyframes are in base.css. */
      "grid grid-cols-[minmax(min-content,1fr)]",
      "before:content-[''] before:[grid-area:1/1] before:sticky before:z-1 before:w-6 before:pointer-events-none before:opacity-0",
      "after:content-[''] after:[grid-area:1/1] after:sticky after:z-1 after:w-6 after:pointer-events-none after:opacity-0",
      "before:[justify-self:start] before:start-0 before:bg-[linear-gradient(to_var(--_end,right),var(--fndn-surface),transparent)]",
      "after:[justify-self:end] after:end-0 after:bg-[linear-gradient(to_var(--_start,left),var(--fndn-surface),transparent)]",
      "rtl:[--_end:left] rtl:[--_start:right]",
      "data-overflow:supports-[animation-timeline:scroll()]:before:[animation-name:fndn-table-veil-start] data-overflow:supports-[animation-timeline:scroll()]:after:[animation-name:fndn-table-veil-end]",
      "supports-[animation-timeline:scroll()]:before:[animation-timing-function:linear] supports-[animation-timeline:scroll()]:after:[animation-timing-function:linear]",
      "supports-[animation-timeline:scroll()]:before:[animation-fill-mode:both] supports-[animation-timeline:scroll()]:after:[animation-fill-mode:both]",
      "supports-[animation-timeline:scroll()]:before:[animation-timeline:scroll(nearest_inline)] supports-[animation-timeline:scroll()]:after:[animation-timeline:scroll(nearest_inline)]",
    ],
    table: "[grid-area:1/1] w-full border-separate border-spacing-0 text-sm font-medium text-ink tabular-nums",
    header: "",
    body: "",
    /* body rows hover at once both ways; the header row never does */
    row: "[[data-slot=table-body]>&]:hover:bg-hover",
    head: [
      GRID_CELL,
      "h-[35px] px-3 py-1.5 text-dense leading-5 font-medium text-ink-2 wrap-break-word",
    ],
    /* the last row draws no rule under it: the card's edge is the end */
    cell: [
      GRID_CELL,
      "[tr:last-child>&]:border-b-0 h-[35px] px-3 py-1.5 leading-5 wrap-break-word",
    ],
    /* a placeholder bar in a loading row: 8px high, a varying share of its column */
    skeleton: [
      "block h-2 min-w-6 max-w-full rounded-pill bg-hover-2",
      "w-[64%] [td:nth-child(3n+2)>&]:w-[42%] [td:nth-child(3n)>&]:w-[78%] [tr:nth-child(even)>td>&]:w-[52%]",
    ],
    caption: "[caption-side:bottom] px-3 py-2 border-t border-solid border-t-(color:--_grid-line) text-xs leading-normal font-normal text-ink-2 text-start [unicode-bidi:plaintext]",
  },
  variants: {
    /* a number column: values and header at the end, figures aligned. Each value takes its
     * direction from its own text (plaintext) while the column keeps the table's alignment, so the
     * side is physical, by the table's direction (a th ignores match-parent in Chromium) */
    numeric: {
      true: { head: "ltr:text-right rtl:text-left", cell: "ltr:text-right rtl:text-left" },
      false: { head: "ltr:text-left rtl:text-right", cell: "ltr:text-left rtl:text-right" },
    },
    /* the column that gives way: it takes the room left and cuts its free text at the end (the
     * adapters keep a title on a cut cell); in flush every other cell stays whole on one line */
    truncate: {
      true: { head: "w-full", cell: "w-full max-w-0 overflow-hidden text-ellipsis whitespace-nowrap" },
    },
    variant: {
      card: {},
      flush: {
        base: [
          "rounded-none bg-transparent shadow-none [--_col-line:transparent] [--_ws:nowrap]",
          /* no veils without a card surface to fade into */
          "before:hidden after:hidden",
        ],
      },
    },
  },
  compoundVariants: [
    /* a number at the end of a placeholder row sits at the end, as its values will */
    { numeric: true, class: { skeleton: "ms-auto" } },
  ],
  defaultVariants: { numeric: false, variant: "card" },
});

export type TableRecipeProps = VariantProps<typeof table>;
