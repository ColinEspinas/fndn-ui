import { tv, type VariantProps } from "../lib/tv";

/* pager — previous · position · next. The buttons are the real button (ghost, sm, square, muted:
 * ink-3 until hovered or pressed); the position is the role="status" region that announces "2 of 3".
 *
 * Layout: between (prev · position · next) or start (position · prev · next). Orientation:
 * horizontal carets point left and right and mirror right-to-left; vertical carets point up and
 * down and never mirror.
 *
 * Rolling digits: each digit is the ten figures stacked in one cell. The current one rests in
 * normal layout with no transform, so it sits on the same pixel rows as the text beside it at every
 * display scale (a reel parked at translateY(-n em) rests on a fraction of a device pixel at 125%
 * or 175% and some figures then render one pixel off). Lower figures wait one
 * line above, higher ones one line below, unseen; a change moves the outgoing figure out and the
 * incoming one in, by transform and opacity, instantly from the keyboard. Nothing at first paint.
 *
 * The previous and next buttons are
 * the real Button, marked data-pager="prev|next"; the other parts carry data-slot="pager-<part>".
 * A reel's figures are placed by their order against the reel's `digit` variant (the digit it
 * shows); the figures have no part of their own, so the reel styles them as its children. */

export const pager = tv({
  slots: {
    base: "inline-flex shrink-0 items-center gap-0.5",
    /* passed to the buttons as className, after their own classes */
    prev: "",
    next: "",
    /* "2 of 3" reads left to right on every page, and its reels keep their order */
    position: "inline-flex items-center text-2xs leading-none text-ink-2 tabular-nums whitespace-pre [direction:ltr] [unicode-bidi:isolate]",
    /* the visible text when it is not what is spoken: it reads exactly like plain text */
    text: "[white-space:inherit]",
    digits: "inline-flex",
    digit: "inline-block h-[1em] overflow-hidden",
    /* every figure in one cell, unseen, waiting one line below; it moves by transform and
     * opacity, instantly from the keyboard (the reel carries kbd-instant; its figures are
     * what moves) */
    reel: [
      "kbd-instant",
      "grid [&>span]:[grid-area:1/1] [&>span]:h-[1em] [&>span]:opacity-0 [&>span]:[transform:translateY(1em)]",
      "[&>span]:motion-transform-move [&>span]:motion-opacity-move [&>span]:kbd-instant",
    ],
    total: "whitespace-pre",
  },
  variants: {
    layout: {
      between: { position: "px-1" },
      start: { position: "order-[-1] pe-1" },
    },
    orientation: {
      horizontal: {
        prev: "[&:dir(rtl)_[data-slot=icon]]:[transform:scaleX(-1)]",
        next: "[&:dir(rtl)_[data-slot=icon]]:[transform:scaleX(-1)]",
      },
      vertical: {},
    },
    /* the digit a reel shows: lower figures wait one line above, the current one is in place,
     * untransformed (so it sits on the same pixel rows as the text beside it at every display
     * scale; a reel at a transform would land a pixel off after a few changes) */
    digit: {
      "0": { reel: "[&>:nth-child(1)]:opacity-100 [&>:nth-child(1)]:[transform:none]" },
      "1": { reel: "[&>:nth-child(-n+1)]:[transform:translateY(-1em)] [&>:nth-child(2)]:opacity-100 [&>:nth-child(2)]:[transform:none]" },
      "2": { reel: "[&>:nth-child(-n+2)]:[transform:translateY(-1em)] [&>:nth-child(3)]:opacity-100 [&>:nth-child(3)]:[transform:none]" },
      "3": { reel: "[&>:nth-child(-n+3)]:[transform:translateY(-1em)] [&>:nth-child(4)]:opacity-100 [&>:nth-child(4)]:[transform:none]" },
      "4": { reel: "[&>:nth-child(-n+4)]:[transform:translateY(-1em)] [&>:nth-child(5)]:opacity-100 [&>:nth-child(5)]:[transform:none]" },
      "5": { reel: "[&>:nth-child(-n+5)]:[transform:translateY(-1em)] [&>:nth-child(6)]:opacity-100 [&>:nth-child(6)]:[transform:none]" },
      "6": { reel: "[&>:nth-child(-n+6)]:[transform:translateY(-1em)] [&>:nth-child(7)]:opacity-100 [&>:nth-child(7)]:[transform:none]" },
      "7": { reel: "[&>:nth-child(-n+7)]:[transform:translateY(-1em)] [&>:nth-child(8)]:opacity-100 [&>:nth-child(8)]:[transform:none]" },
      "8": { reel: "[&>:nth-child(-n+8)]:[transform:translateY(-1em)] [&>:nth-child(9)]:opacity-100 [&>:nth-child(9)]:[transform:none]" },
      "9": { reel: "[&>:nth-child(-n+9)]:[transform:translateY(-1em)] [&>:nth-child(10)]:opacity-100 [&>:nth-child(10)]:[transform:none]" },
    },
  },
  defaultVariants: { layout: "between", orientation: "horizontal" },
});

export type PagerRecipeProps = VariantProps<typeof pager>;
