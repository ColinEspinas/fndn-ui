import { tv, type VariantProps } from "../lib/tv";

/* code-view — code on its own, with line numbers: a listing, a diff, or an editor. No frame: the
 * host (a Code Block's card, an editor pane) draws it. Every colour is a token.
 *
 * The font, the 20px line and the colour sit on the root, so the read-only listing and the editor
 * (code-view.editor.ts, which makes CodeMirror inherit them) are drawn alike. The listing is a grid:
 * one gutter column as wide as the widest number, then the code; each row is a subgrid. Code reads
 * left to right, also in right-to-left pages. */

const MONO = "[direction:ltr] font-mono";

export const codeView = tv({
  slots: {
    /* the box: fixed height (height), a cap (maxHeight) or the code's; the code scrolls inside */
    base: [
      "relative flex min-w-0 flex-col bg-surface text-dense leading-5 text-ink-2",
      MONO,
      "h-[var(--fndn-code-view-height,auto)] max-h-[var(--fndn-code-view-max-height,none)]",
    ],
    /* the read-only scroller: 12px block inset; a focusable region while it overflows */
    body: [
      "min-h-0 flex-1 overflow-auto overscroll-x-contain py-3",
      "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:-outline-offset-2",
    ],
    rows: "grid grid-cols-[max-content_minmax(0,1fr)]",
    row: "relative col-[1/-1] grid grid-cols-subgrid",
    bar: "absolute inset-y-0 start-0 w-[3px]",
    /* line numbers: right-aligned on the gutter's hairline; not selectable, so a hand copy skips them */
    num: "col-[1] min-w-5 px-1 border-e border-e-line text-2xs tabular-nums text-end text-ink-3 select-none",
    code: "col-[2] min-w-0 ps-1 pe-3 [font:inherit]",
    /* word-level add / del highlight (the change variant) */
    piece: "rounded-[3px] px-0.5 -mx-px box-decoration-clone",
    /* light syntax colouring: keywords, strings and numbers, function calls (the tok variant);
     * the editor marks the same runs with the same classes */
    tok: "",
    /* where the editor is mounted; its own markup inside is themed by code-view.editor.ts */
    editor: "isolate flex min-h-0 flex-1 flex-col [&>.cm-editor]:min-h-0 [&>.cm-editor]:flex-1",
    /* the fold marker's icon, which the editor copies into its gutter */
    icons: "hidden",
    /* the find widget: floats over the code at its top end corner, so opening it moves nothing;
     * the popup's surface, shadow and radius, 4px inset. At a narrow width it spans the view less
     * 8px each side. Row 1: the replace caret, the find field (its options inside its end), the
     * count, Previous, Next, Close; row 2, while shown: the replace field and its two actions. */
    search: "absolute top-2 end-2 flex w-max max-w-[calc(100%-16px)] flex-col gap-1 rounded-card bg-surface p-1 font-sans text-ink shadow-raised",
    searchRow: "flex min-w-0 items-center gap-1",
    /* the caret turns down while the replace row shows, as a disclosure's does */
    searchExpand: "[&_[data-slot=icon]]:motion-transform-move [&_[data-slot=icon]]:kbd-instant [&[aria-expanded=true]_[data-slot=icon]]:rotate-90",
    /* the option toggles' faces are short mono glyphs (Aa, ab, .*), as editors show them */
    searchField: "w-56 min-w-0 flex-1 [&_[data-slot=input-group-end]_button]:font-mono [&_[data-slot=input-group-end]_button]:text-[11px]",
    /* "3 of 12": as wide as "No results", so the row keeps still while it counts */
    searchCount: "min-w-16 shrink-0 px-1 text-center text-xs whitespace-nowrap tabular-nums text-ink-2",
    replaceField: "w-56 min-w-0 flex-1 ms-7",
  },
  variants: {
    /* the diff's accent bar sits in the gutter: numbers keep clear of it */
    diff: { true: { num: "ps-[7px]" } },
    /* wrap: long lines wrap (as in documentation). Off: a line never wraps, the code scrolls
     * sideways, and the gutter (and a diff's accent bar) stays at the inline start over an opaque
     * fill, so code slides under it. Code reads left to right in every page, so the sticky start is
     * the left edge. */
    wrap: {
      true: { code: "wrap-anywhere whitespace-pre-wrap" },
      false: {
        rows: "w-max min-w-full grid-cols-[max-content_1fr]",
        /* every cell sits on the row's one line (the bar shares the gutter's cell) */
        code: "row-[1] whitespace-pre",
        num: "sticky start-0 z-[1] row-[1] bg-surface",
        /* the bar leaves its absolute place for the gutter's cell, so it sticks with the numbers */
        bar: "sticky start-0 inset-y-auto z-[2] col-[1] row-[1] self-stretch justify-self-start",
      },
    },
    /* editable: the editor's fold column (12px after the gutter's hairline) is kept free in the
     * listing shown while the editor loads, so nothing moves when it arrives */
    fold: { true: { code: "ps-4" } },
    /* the editor is mounted but not shown yet: it lies over the listing, laid out at the same size
     * (so it measures and takes the listing's scroll position), and invisible */
    ready: { false: { editor: "invisible absolute inset-0" } },
    /* as tall as its container: the code scrolls inside */
    fill: { true: { base: "h-full min-h-0" } },
    /* the current line: the row is tinted across the gutter and the code, its number turns ink */
    current: { true: { row: "bg-hover", num: "text-ink" } },
    /* a diff row's kind: tint, accent bar (striped for a removal) and number colour */
    type: {
      ctx: {},
      add: { row: "bg-green-tint", bar: "bg-green", num: "text-green" },
      del: {
        row: "bg-red-tint",
        bar: "bg-[repeating-linear-gradient(45deg,var(--fndn-red)_0,var(--fndn-red)_1.5px,transparent_1.5px,transparent_3px)]",
        num: "text-red",
      },
    },
    change: {
      add: { piece: "bg-[color-mix(in_srgb,var(--fndn-green)_18%,transparent)]" },
      del: { piece: "bg-[color-mix(in_srgb,var(--fndn-red)_18%,transparent)]" },
    },
    tok: {
      kw: { tok: "text-accent-ink" },
      str: { tok: "text-orange" },
      fn: { tok: "font-medium text-ink" },
    },
  },
  /* a sticky gutter number carries its row's tint over the opaque surface */
  compoundVariants: [
    { wrap: false, current: true, class: { num: "bg-hover" } },
    { wrap: false, type: "add", class: { num: "bg-[linear-gradient(var(--fndn-green-tint),var(--fndn-green-tint))]" } },
    { wrap: false, type: "del", class: { num: "bg-[linear-gradient(var(--fndn-red-tint),var(--fndn-red-tint))]" } },
  ],
  defaultVariants: { diff: false, wrap: true, fold: false, ready: true, fill: false, current: false },
});

export type CodeViewRecipeProps = VariantProps<typeof codeView>;
