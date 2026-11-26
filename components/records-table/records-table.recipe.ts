import { tv, type VariantProps } from "../lib/tv";

/* records-table — a records grid in the spreadsheet manner: one quiet surface, precise rules,
 * colour kept for meaning. The header and the first column stay put while both axes scroll.
 * Rows never animate on sort, hide or load (functional data); hover is colour only and gated.
 * Row numbers are a CSS counter, so a sort only moves rows and never rewrites them.
 *
 * Composed parts, rendered by the adapter: tags are the real Tag, "+N" is a boxed Count, the
 * column, Columns and row menu triggers are Buttons (ghost, xs, square, rounded, muted) with
 * Tooltips, restyled by the menu-trigger slot (its `trigger` variant says which; marked data-menu="trigger" and data-records-table="menu-trigger"); the column and
 * Columns menus are Menus whose root takes the col-menu / columns-menu slot; the shared row menu
 * is drawn with the menu recipe; the checkboxes are Checkboxes (the check slot); the empty table
 * is an EmptyState; Clear selection is a Button (the selection-clear slot).
 *
 * Row state reaches the cells through inherited properties set on the row (--_cell-bg), and the
 * header's and the row's hover through the named groups rt-th and rt-row (only these parts carry
 * them, so nothing nested can match). The row hover is instant both ways (--_cell-hover, a layer over
 * the fill); only a selection under the pointer eases the fill: a
 * select-all or a sort changes hundreds of cells at once, and a transition on each of them costs
 * more than the whole repaint. */

/* the rules shared by header and body cells */
const GRID_CELL = "p-0 border-e border-b border-e-(color:--_grid-line) border-b-(color:--_grid-line) text-start align-middle";
/* sticky first column's soft edge */
const EDGE = "shadow-[5px_0_8px_-10px_oklch(0_0_0/0.4)] rtl:shadow-[-5px_0_8px_-10px_oklch(0_0_0/0.4)]";
/* one line, cut at the end; each value takes its direction from its own text while the column
 * keeps the table's alignment */
const TRUNCATE = "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap [unicode-bidi:plaintext] [text-align:match-parent]";
/* a row control revealed by the row under the pointer, keyboard focus, or a touch screen */
const ON_TOUCH = "pointer-coarse:opacity-100 [@media(hover:none)]:opacity-100";

export const recordsTable = tv({
  slots: {
    base: [
      "relative w-full min-w-0 overflow-hidden rounded-card bg-surface shadow-card",
      "[--_grid-line:var(--fndn-line)]",
      "[--_selected:color-mix(in_srgb,var(--fndn-accent)_7%,var(--fndn-surface))]",
      "[--_selected-hover:color-mix(in_srgb,var(--fndn-accent)_11%,var(--fndn-surface))]",
    ],
    /* both axes scroll here; a wheel at the top or bottom goes on to the page, sideways overscroll
     * stays in (no back gesture: overscroll-x-contain). contain: the table's width
     * never leaks into a shrink-to-fit parent, so it scrolls here instead of widening the page.
     * A table cut at the end of the region fades into the surface there (a mask is ruled out: it
     * would cut the card's shadow). The region is a one-column grid as wide as the table, so a
     * sticky veil can share the table's area and ride the region's end edge. It shows while there
     * is more past the end, at once (no time involved): data-overflow-end, kept in step with the
     * scroll position by watchVeils (lib/veil.ts); a table that fits has none. The start side
     * needs no veil: the sticky first column covers what scrolls under it, with its own soft edge. */
    scroll: [
      "[container-type:inline-size] grid grid-cols-[minmax(min-content,1fr)] max-h-[438px] overflow-auto overscroll-x-contain",
      "[scrollbar-color:var(--fndn-line-strong)_transparent] [scrollbar-width:thin]",
      "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2",
      "after:content-[''] after:[grid-area:1/1] after:[justify-self:end] after:sticky after:end-0 after:z-4 after:w-6 after:pointer-events-none after:opacity-0",
      "after:bg-[linear-gradient(to_var(--_start,left),var(--fndn-surface),transparent)] rtl:[--_start:right]",
      "data-overflow-end:after:opacity-100",
    ],
    /* row numbers count the rows of the body in their current order */
    table: "[grid-area:1/1] w-full table-fixed border-separate border-spacing-0 text-sm font-medium text-ink [&>tbody]:[counter-reset:fndn-records-row]",
    headRow: "h-[35px]",
    /* header — sticky on the block axis; the first header cell is the corner and sits above all,
     * and never takes more than half of a narrow table */
    th: [
      "group/rt-th", GRID_CELL, "last:border-e-0 last:border-e-current",
      "sticky top-0 z-2 h-[35px] w-(--fndn-col-width) bg-surface text-dense font-medium text-ink-2",
      "aria-[sort=ascending]:text-ink aria-[sort=descending]:text-ink",
    ],
    thInner: "flex items-center h-[35px] min-w-0",
    /* the header's hover is a plain group variant, so the press (later, same weight) is never masked by it */
    sort: [
      "flex flex-1 items-center gap-2 min-w-0 h-full px-3 border-0 bg-transparent [font:inherit] text-inherit text-start cursor-pointer",
      "motion-colors-fast group-hover/rt-th:bg-hover group-hover/rt-th:text-ink active:bg-hover-2",
      "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2",
    ],
    thLabel: [
      "flex-[0_1_auto]", TRUNCATE,
      "[[data-slot=records-table-th-inner]>&]:flex-1 [[data-slot=records-table-th-inner]>&]:px-3",
    ],
    /* the arrow follows the label; it points down for ascending and turns over for descending */
    sortIcon: [
      "kbd-instant",
      "inline-flex shrink-0 text-[12px] text-ink-3 opacity-0 motion-opacity-fast motion-transform-move group-hover/rt-th:opacity-100",
      "[[data-slot=records-table-th]:is([aria-sort=ascending],[aria-sort=descending])_&]:opacity-100 [[data-slot=records-table-th]:is([aria-sort=ascending],[aria-sort=descending])_&]:text-ink-2",
      "[[data-slot=records-table-th][aria-sort=descending]_&]:[transform:rotate(180deg)]",
    ],
    /* a column's menu (a Menu's root) lies over the end of its header (the start, for numbers, whose
     * label sits at the end), so the label keeps the whole width at rest */
    colMenu: "absolute inset-y-0 end-1.5 flex items-center",
    columnsMenu: "align-middle",
    /* a larger invisible hit area keeps the triggers easy to reach in a 35px row */
    menuTrigger: "relative after:content-[''] after:absolute after:-inset-1.5",
    row: [
      "group/rt-row h-[35px] [counter-increment:fndn-records-row]",
      "[--_cell-bg:var(--fndn-surface)] hover:[--_cell-hover:var(--fndn-hover)]",
    ],
    /* body cells — one row height, truncation at the end; the full value is in title. Cells out of
     * view skip their rendering: a sort or a select-all over hundreds of rows only repaints what is
     * on screen (measured at 500 rows: about 190ms of rendering down to about 85ms) */
    cell: [
      GRID_CELL, "last:border-e-0 last:border-e-current [tr:last-child>&]:border-b-0 [tr:last-child>&]:border-b-current",
      "h-[35px] px-2 overflow-hidden text-ellipsis whitespace-nowrap bg-(--_cell-bg) [content-visibility:auto] [contain-intrinsic-size:auto_35px]",
      /* the hover is a layer over the fill (unset at rest: no image), so it is lit and unlit at once
       * while a selection under the pointer still eases the fill beneath it */
      "[background-image:linear-gradient(var(--_cell-hover),var(--_cell-hover))]",
      "group-hover/rt-row:motion-colors-fast",
    ],
    primary: "flex items-center gap-1.5 min-w-0",
    /* the row number at rest; the checkbox takes its place on hover, keyboard focus or selection.
     * Both share one grid cell, so nothing moves. */
    gutter: "grid shrink-0 place-items-center size-6 [&>*]:[grid-area:1/1]",
    rownum: [
      "text-[11.5px] font-medium tabular-nums text-ink-3 [direction:ltr] [unicode-bidi:isolate] before:content-[counter(fndn-records-row)] motion-opacity-fast",
      "group-hover/rt-row:opacity-0 pointer-coarse:opacity-0 [@media(hover:none)]:opacity-0",
      "[[data-slot=records-table-gutter]:has(:focus-visible)>&]:opacity-0 [[data-slot=records-table-gutter]:has([data-focus-visible])>&]:opacity-0",
    ],
    /* keyboard focus shows the checkbox at full strength, the header's too */
    check: "[[data-slot=records-table-gutter]:has(:focus-visible)>&]:opacity-100 [[data-slot=records-table-gutter]:has([data-focus-visible])>&]:opacity-100",
    text: ["block", TRUNCATE, "[[data-slot=records-table-primary]>&]:flex-1"],
    number: "tabular-nums [direction:ltr] [unicode-bidi:isolate]",
    /* tags are the real Tag; here they share the cell, shrink to fit and truncate */
    tags: [
      "flex items-center gap-1 min-w-0 overflow-hidden",
      "[&>[data-slot=tag]]:flex-[0_1_auto] [&>[data-slot=tag]]:min-w-6 [&>[data-slot=tag]]:max-w-[115px]",
      "[&_[data-slot=tag-label]]:[text-align:match-parent]",
    ],
    status: [
      "inline-flex items-center gap-2 max-w-full text-ink-2 [--_dot:var(--fndn-ink-3)]",
    ],
    dot: "shrink-0 size-2 rounded-[50%] bg-(--_dot)",
    link: [
      "inline-flex items-center gap-[5px] max-w-full align-middle text-accent-ink",
      "underline decoration-[color:color-mix(in_srgb,currentColor_35%,transparent)] underline-offset-3",
      "motion-colors-fast hover:text-ink hover:decoration-current",
      "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 focus-visible:rounded-[2px]",
      "[&>[data-slot=icon]]:shrink-0 [&>[data-slot=icon]]:text-[12px]",
    ],
    linkText: TRUNCATE,
    blank: "text-ink-3",
    /* on the row menu positioner (drawn with the menu recipe), marked data-records-table="row-menu" */
    rowMenu: "",
    emptyRow: "h-[35px]",
    /* an EmptyState across every column; it takes the width of the scroll region and stays put
     * while the region scrolls, so it is always in view however wide the table is */
    empty: [
      GRID_CELL, "[tr:last-child>&]:border-b-0 [tr:last-child>&]:border-b-current",
      "[&>[data-slot=empty-state]]:sticky [&>[data-slot=empty-state]]:start-0 [&>[data-slot=empty-state]]:w-[100cqi]",
    ],
    /* selection bar — reveals under the table, so nothing above it moves.
     * fndn-check-ok: a status bar that appears with a selection, not a disclosure (no trigger) */
    selection: [
      "kbd-instant grid grid-rows-[0fr] opacity-0 motion-size-reveal motion-opacity-base",
      "[&>*]:min-h-0 [&>*]:overflow-hidden",
    ],
    selectionInner: "flex items-center gap-2 border-t border-line bg-inset",
    selectionCount: ["py-2 ps-3 pe-0 text-xs font-medium tabular-nums text-ink-2", "[unicode-bidi:plaintext] [text-align:match-parent]"],
    /* the caller's bulk actions (Buttons, a Menu), right after the count */
    selectionActions: "flex items-center gap-1 ms-1",
    selectionClear: "ms-auto me-1.5 leading-7",
  },
  variants: {
    /* which menu trigger: a column's and a row's wait for their header or row; Columns is always there */
    trigger: {
      columns: {},
      /* filled, so it covers the end of the label it lies over; it hovers and presses a step darker */
      column: {
        menuTrigger: [
          "opacity-0 group-hover/rt-th:opacity-100 focus-visible:opacity-100! aria-expanded:opacity-100!", ON_TOUCH,
          "bg-hover-2 text-ink-2 hover:bg-line-strong hover:text-ink",
          "active:bg-[color-mix(in_oklch,var(--fndn-line-strong)_75%,var(--fndn-ink-3))] active:text-ink",
          "aria-expanded:bg-[color-mix(in_oklch,var(--fndn-line-strong)_75%,var(--fndn-ink-3))] aria-expanded:text-ink",
          "aria-expanded:hover:bg-[color-mix(in_oklch,var(--fndn-line-strong)_75%,var(--fndn-ink-3))]",
        ],
      },
      row: { menuTrigger: ["inline-flex align-middle opacity-0 group-hover/rt-row:opacity-100 focus-visible:opacity-100! aria-expanded:opacity-100!", ON_TOUCH] },
    },
    /* the first column is the anchor: sticky at the inline start, with a soft edge; the first
     * header cell is the corner, above all, never more than half of a narrow table. The padding
     * keeps the specificity it had over the cells' own (a selector, not a plain utility). */
    primary: {
      true: {
        th: ["start-0 z-3 w-[min(var(--fndn-col-width),50cqi)]", EDGE],
        thInner: "gap-0.5 ps-1.5",
        sort: "[[data-slot=records-table-th]_&]:ps-1.5 [[data-slot=records-table-th]_&]:pe-3",
        thLabel: "[[data-slot=records-table-th]>[data-slot=records-table-th-inner]>&]:ps-1.5 [[data-slot=records-table-th]>[data-slot=records-table-th-inner]>&]:pe-3",
        cell: ["sticky start-0 z-1 [[data-slot=records-table-row]>&]:ps-1.5 [[data-slot=records-table-row]>&]:pe-2", EDGE],
      },
    },
    /* a number column: its values and its header align at the end; the column menu lies over the start */
    numeric: {
      true: {
        sort: "flex-row-reverse",
        thLabel: "[[data-slot=records-table-th]>[data-slot=records-table-th-inner]>&]:text-end",
        colMenu: "[[data-slot=records-table-th]>[data-slot=records-table-th-inner]>&]:start-1.5 [[data-slot=records-table-th]>[data-slot=records-table-th-inner]>&]:end-auto",
        cell: "text-end text-clip",
      },
    },
    /* the trailing column of the menus */
    actions: { true: { th: "text-center", cell: "p-0 text-center" } },
    /* a selected row: its fill, its number gives way to its checkbox */
    selected: {
      true: {
        row: "[--_cell-bg:var(--_selected)] hover:[--_cell-hover:var(--_selected-hover)]",
        rownum: "opacity-0",
      },
    },
    /* a status value's dot */
    tone: {
      neutral: {},
      green: { status: "[--_dot:var(--fndn-green)]" },
      orange: { status: "[--_dot:var(--fndn-orange)]" },
      red: { status: "[--_dot:var(--fndn-red)]" },
      accent: { status: "[--_dot:var(--fndn-accent)]" },
    },
    /* onRowOpen: a click on the row opens it (the pointer says so); the focused row (roving
     * tabindex, from the keyboard) carries the focus ring inside its edge */
    openable: {
      true: { row: "cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:-outline-offset-2" },
    },
    /* the selection bar shows while rows are selected */
    open: { true: { selection: "grid-rows-[1fr] opacity-100" } },
    /* the body checkboxes wait for their row; the header's select-all is always there */
    body: {
      true: {
        check: [
          "opacity-0 motion-opacity-fast group-hover/rt-row:opacity-100", ON_TOUCH,
        ],
      },
    },
  },
  compoundVariants: [
    /* a selected row keeps its checkbox shown */
    { body: true, selected: true, class: { check: "opacity-100" } },
  ],
  defaultVariants: { trigger: "columns" },
});

export type RecordsTableRecipeProps = VariantProps<typeof recordsTable>;
