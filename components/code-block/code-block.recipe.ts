import { tv, type VariantProps } from "../lib/tv";

/* code-block — the card around a Code View: a header (file icon, file name, Copy or a diff's stat),
 * tabbed files, or a one-line command. The code itself, its gutter, colours, wrapping, scrolling and
 * current line, is the Code View's (code-view.recipe.ts). Every colour is a token. Only Copy has
 * motion (the button's own).
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
 * and the path goes too (the select names the file). */

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
    /* the Code View under the header */
    view: "",
    path: [
      "flex-[0_1000_auto] min-w-0 ms-auto ps-2 overflow-hidden text-ellipsis whitespace-nowrap",
      "text-xs leading-none text-ink-2",
      MONO,
    ],
    pager: "flex-none -ms-1.5",
    fileSelect: "flex-[0_1_auto] min-w-0 me-auto",
    /* command — one line to copy (an install command): no header, no line numbers, copy at the end */
    command: "flex min-h-11 items-center gap-2 ps-4 pe-2.5",
    /* the command's code: one line that scrolls sideways */
    code: [
      "flex-1 min-w-0 p-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden whitespace-pre",
      "[font-style:inherit] [font-weight:inherit] [font-stretch:inherit] [font-variant:inherit]",
      "text-dense leading-5 text-ink",
      MONO,
    ],
  },
  variants: {
    variant: {
      code: {},
      diff: {},
      /* a command is one line and often a long one: the block may be wider than a listing */
      command: { base: "max-w-[640px]" },
    },
    /* the file tabs share the header: they shrink, and give way to the pager and the select */
    files: {
      true: {
        base: [
          "[&_[data-slot=tabs-list]]:flex-[0_1_auto] [&_[data-slot=tabs-list]]:min-w-0",
        ],
      },
    },
    /* the file tabs do not fit beside Copy (measured in code-block.logic.ts): a pager and a select stand in */
    fit: {
      tabs: {},
      select: { base: "[&_[data-slot=tabs-list]]:hidden [&_[data-slot=code-block-path]]:hidden" },
    },
    /* fills its container's height (an editor pane): the box is a column as tall as its parent and
     * the Code View takes what the header leaves, scrolling past it; no max width either. With files
     * the Tabs root and the open panel pass the height on. */
    fill: {
      true: {
        base: [
          "flex h-full min-h-0 max-w-none flex-col",
          "[&>[data-slot=tabs]]:flex [&>[data-slot=tabs]]:flex-col [&>[data-slot=tabs]]:flex-1 [&>[data-slot=tabs]]:min-h-0",
          "[&>[data-slot=tabs]>[data-slot=tabs-content]:not([hidden])]:flex [&>[data-slot=tabs]>[data-slot=tabs-content]:not([hidden])]:flex-col",
          "[&>[data-slot=tabs]>[data-slot=tabs-content]]:flex-1 [&>[data-slot=tabs]>[data-slot=tabs-content]]:min-h-0",
        ],
        header: "shrink-0",
        view: "flex-1 min-h-0",
      },
    },
    /* Copy while it says Copied */
    copied: {
      true: { copy: "text-green!" },
    },
  },
  defaultVariants: { variant: "code", files: false, fit: "tabs", copied: false, fill: false },
});

export type CodeBlockRecipeProps = VariantProps<typeof codeBlock>;
