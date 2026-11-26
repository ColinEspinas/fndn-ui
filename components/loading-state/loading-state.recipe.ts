import { tv, type VariantProps } from "../lib/tv";

/* loading-state — pixel-grid loader for long-running work.
 *   drive  square cells, chevron wavefront driving right (650ms cycle)
 *   dots   same wavefront, circular cells
 *   orbit  a comet lapping the grid perimeter (950ms)
 * Paired with a shimmering label (the real Shimmer, fast; this recipe's `label` is passed to it as
 * className) and an elapsed timer in mono tabular figures.
 *
 * Motion: three loops and nothing else. The grid is opacity-only and keeps pulsing under reduced
 * motion (it is the loading signal); the label shimmer stops there and shows static ink-2 text.
 * The loop timings are literal (like the spinner's): --_dur on the root, --_delay per cell.
 * fndn-pixel-on is in base.css. The label is the real Shimmer, marked
 * data-loading-state="label". */

export const loadingState = tv({
  slots: {
    base: "[--_dur:650ms] inline-flex w-fit max-w-full min-w-0 items-center gap-2.5",
    grid: "grid shrink-0 grid-cols-[repeat(3,4px)] gap-[1.5px]",
    cell: [
      "size-1 rounded-[1px] bg-ink opacity-15",
      "animate-[fndn-pixel-on_var(--_dur)_ease_var(--_delay,0ms)_infinite]",
      /* chevron wavefront: delay = (col + |row - 1|) * 90ms */
      "nth-1:[--_delay:90ms] nth-2:[--_delay:180ms] nth-3:[--_delay:270ms]",
      "nth-4:[--_delay:0ms] nth-5:[--_delay:90ms] nth-6:[--_delay:180ms]",
      "nth-7:[--_delay:90ms] nth-8:[--_delay:180ms] nth-9:[--_delay:270ms]",
    ],
    /* on the Shimmer: truncates here, the full text in its title */
    label: "min-w-0 overflow-hidden text-ellipsis text-sm font-medium whitespace-nowrap [unicode-bidi:plaintext]",
    elapsed: "font-mono text-xs tabular-nums whitespace-nowrap shrink-0 text-ink-2 [unicode-bidi:plaintext]",
  },
  variants: {
    variant: {
      drive: {},
      dots: { cell: "rounded-[50%]" },
      /* perimeter order 1 2 3 6 9 8 7 4, 110ms apart; the center stays dim */
      orbit: {
        base: "[--_dur:950ms]",
        cell: [
          "nth-1:[--_delay:0ms] nth-2:[--_delay:110ms] nth-3:[--_delay:220ms] nth-6:[--_delay:330ms]",
          "nth-9:[--_delay:440ms] nth-8:[--_delay:550ms] nth-7:[--_delay:660ms] nth-4:[--_delay:770ms]",
          "nth-5:opacity-[0.07] nth-5:animate-none",
        ],
      },
    },
  },
  defaultVariants: { variant: "drive" },
});

export type LoadingStateRecipeProps = VariantProps<typeof loadingState>;
