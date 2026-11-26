import { tv, type VariantProps } from "../lib/tv";

/* code-block — a light editor panel: line-numbered listing, unified diff, tabbed files or a
 * one-line command. Every colour is a token. The Code / Diff switch does not animate; only Copy
 * has motion (the button's own).
 *
 * Copy is a Button (ghost, xs, rounded, muted) with two labels in one cell: the button is as
 * wide as the label it shows, and its `swapped` prop cross-fades Copy into Copied. Only the green of
 * "Copied" (the `copied` variant) and the placement are the code block's; the button is marked
 * data-code-block="copy". The announcement is a visually hidden role=status beside it (status part).
 *
 * Files: one header row, the same 44px as a single file's: the file tabs (Tabs, underline,
 * inHeader) at the start, then the active file's path and the block's one Copy, pushed to
 * the end. The path is the first thing to shrink (cut in the middle, its title holds the whole
 * path). Names of choices are shown whole: when the tabs do not fit beside Copy (measured in
 * code-block.logic.ts, the `fit` variant), they give way to a Pager and a select that lists every file,
 * and the path goes too (the select names the file). Diff rows, word pieces and tokens take their
 * kind as a variant (type, change, tok). */

const MONO = "[direction:ltr] font-mono";

export const codeBlock = tv({
  slots: {
    base: "w-full max-w-[420px] min-w-0 overflow-hidden rounded-card bg-surface shadow-card",
    /* header — file · (diff stat | copy); also the Tabs header of a block with files */
    header: "flex h-11 items-center gap-2 px-4 border-b border-line text-dense",
    fileIcon: "inline-block shrink-0 size-[15px] text-[15px] leading-none align-[-0.125em] text-ink-3",
    filename: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono leading-none text-ink",
    /* Copy keeps its end placement; a path before it already took the free space */
    copy: [
      "shrink-0 ms-auto -me-1 [[data-slot=code-block-path]~&]:ms-0",
    ],
    stat: [
      "inline-flex shrink-0 ms-auto items-center gap-2 text-xs leading-none tabular-nums",
      MONO,
      /* added count, then removed count */
      "[&>:first-child]:text-green [&>:last-child]:text-red",
    ],
    /* body — equal 12px inset on top / left / right; lines wrap (unless wrap is off); scrolls past the max height; a
     * fixed height (height prop) keeps the box still while code loads or tabs change. Code reads
     * left to right, also in right-to-left pages. */
    body: [
      "h-[var(--fndn-code-block-height,auto)] max-h-[var(--fndn-code-block-max-height,none)]",
      "overflow-auto overscroll-x-contain py-3 text-dense leading-5 text-ink-2",
      MONO,
      "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:-outline-offset-2",
    ],
    /* one gutter column for every row (rows are subgrids), as wide as the widest number */
    rows: "grid grid-cols-[max-content_minmax(0,1fr)]",
    row: "relative grid col-[1/-1] grid-cols-subgrid",
    bar: "absolute inset-y-0 start-0 w-[3px]",
    /* line numbers: right-aligned on the gutter edge; not selectable, so a hand copy skips them */
    num: [
      "col-[1] min-w-5 px-1 border-e border-e-line text-2xs tabular-nums text-end text-ink-3 select-none",
    ],
    code: "col-[2] min-w-0 ps-1 pe-3",
    /* word-level add / del highlight (the change variant) */
    piece: "rounded-[3px] px-0.5 -mx-px box-decoration-clone",
    /* light syntax colouring — keywords, strings and numbers, function calls (the tok variant) */
    tok: "",
    path: [
      "flex-[0_1000_auto] min-w-0 ms-auto ps-2 overflow-hidden text-ellipsis whitespace-nowrap",
      "text-xs leading-none text-ink-2",
      MONO,
    ],
    pager: "flex-none -ms-1.5",
    fileSelect: "flex-[0_1_auto] min-w-0 me-auto",
    /* command — one line to copy (an install command): no header, no line numbers, copy at the end */
    command: "flex min-h-11 items-center gap-2 ps-4 pe-2.5",
  },
  variants: {
    variant: {
      code: { code: "[font:inherit]" },
      /* the diff's accent bar sits in the gutter: numbers keep clear of it */
      diff: { num: "ps-[7px]", code: "[font:inherit]" },
      /* a command is one line and often a long one: the block may be wider than a listing */
      command: {
        base: "max-w-[640px]",
        code: [
          "flex-1 min-w-0 p-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden whitespace-pre",
          "[font-style:inherit] [font-weight:inherit] [font-stretch:inherit] [font-variant:inherit]",
          "text-dense leading-5 text-ink",
          MONO,
        ],
      },
    },
    /* wrap: long lines wrap (as in documentation). Off (the editor's default): a line never wraps, the
     * body scrolls sideways, and the gutter (and a diff's accent bar) stays at the inline start,
     * over an opaque background so code slides under it. Code reads left to right in every page, so
     * the sticky start is the left edge. */
    wrap: {
      true: { code: "wrap-anywhere whitespace-pre-wrap" },
      false: {
        rows: "w-max min-w-full grid-cols-[max-content_1fr]",
        /* every cell sits on the row's one line (the bar shares the gutter's cell) */
        code: "whitespace-pre row-[1]",
        num: "sticky start-0 z-[1] row-[1] bg-surface",
        /* the bar leaves its absolute place for the gutter's cell, so it sticks with the numbers */
        bar: "sticky start-0 inset-y-auto z-[2] col-[1] row-[1] self-stretch justify-self-start",
      },
    },
    /* editor: the body of an editor pane. The host draws the file tabs, so no frame, no header, no
     * copy and no path; the block fills its container and the code is the editor's 13px. */
    editor: {
      true: {
        base: "flex h-full min-h-0 max-w-none flex-col rounded-none shadow-none",
        body: "flex-1 min-h-0 text-[13px]",
      },
    },
    /* the file tabs share the header: they shrink, and give way to the pager and the select */
    files: {
      true: {
        base: [
          "[&_[data-slot=tabs-list]]:flex-[0_1_auto] [&_[data-slot=tabs-list]]:min-w-0",
          "[&>[data-slot=tabs]>[data-slot=tabs-content]]:pt-0",
        ],
      },
    },
    /* the file tabs do not fit beside Copy (measured in code-block.logic.ts): a pager and a select stand in */
    fit: {
      tabs: {},
      select: { base: "[&_[data-slot=tabs-list]]:hidden [&_[data-slot=code-block-path]]:hidden" },
    },
    /* fills its container's height (an editor pane): the box is a column as tall as its parent and
     * the body takes what the header leaves, scrolling past it; no max width either. With files the
     * Tabs root and the open panel pass the height on. */
    fill: {
      true: {
        base: [
          "flex h-full min-h-0 max-w-none flex-col",
          "[&>[data-slot=tabs]]:flex [&>[data-slot=tabs]]:flex-col [&>[data-slot=tabs]]:flex-1 [&>[data-slot=tabs]]:min-h-0",
          "[&>[data-slot=tabs]>[data-slot=tabs-content]:not([hidden])]:flex [&>[data-slot=tabs]>[data-slot=tabs-content]:not([hidden])]:flex-col",
          "[&>[data-slot=tabs]>[data-slot=tabs-content]]:flex-1 [&>[data-slot=tabs]>[data-slot=tabs-content]]:min-h-0",
        ],
        header: "shrink-0",
        body: "flex-1 min-h-0",
      },
    },
    /* the current line (currentLine): the row is tinted across the gutter and the code, and its
     * number turns ink, as an editor marks the caret's line */
    current: {
      true: { row: "bg-hover", num: "text-ink" },
    },
    /* Copy while it says Copied */
    copied: {
      true: { copy: "text-green!" },
    },
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
    /* word-level add / del highlight */
    change: {
      add: { piece: "bg-[color-mix(in_srgb,var(--fndn-green)_18%,transparent)]" },
      del: { piece: "bg-[color-mix(in_srgb,var(--fndn-red)_18%,transparent)]" },
    },
    tok: {
      kw: { tok: "text-accent-ink" },
      str: { tok: "text-orange" },
      fn: { tok: "text-ink font-medium" },
    },
  },
  /* a sticky gutter number carries its row's tint over the opaque surface */
  compoundVariants: [
    { wrap: false, current: true, class: { num: "bg-hover" } },
    { wrap: false, type: "add", class: { num: "bg-[linear-gradient(var(--fndn-green-tint),var(--fndn-green-tint))]" } },
    { wrap: false, type: "del", class: { num: "bg-[linear-gradient(var(--fndn-red-tint),var(--fndn-red-tint))]" } },
  ],
  defaultVariants: { variant: "code", files: false, fit: "tabs", copied: false, fill: false, current: false, wrap: true, editor: false },
});

export type CodeBlockRecipeProps = VariantProps<typeof codeBlock>;
