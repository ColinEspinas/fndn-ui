import { tv, type VariantProps } from "../lib/tv";

/* thinking-state — expandable agent trace.
 * Header: the real Collapsible (inline, caret first): caret · sparkle · shimmering label while
 * working (the real Shimmer, fast), settles to ink-2. The caret leads, as in tool-chips' run header,
 * so the label changing length ("Thinking" → "Thought for 4s") moves nothing under the pointer. The sparkle and the live label sit in the collapsible's
 * label part, laid out by the header slot (passed as the Collapsible's labelClass).
 * Trace: a hairline rail that grows as rows arrive (check / spinner · primary · secondary).
 * Fully controlled: working, aria-expanded and the rows come from the host.
 *
 * Motion (`docs motion`), all here:
 *   mount     a mount is not an arrival: a plain mount shows its rows at once. With appear (the
 *             host's prop, for a trace its code adds live) the rows present at first render fade
 *             up, staggered and capped (--fndn-row-index, set by the adapter only on those rows);
 *             the header does not move
 *   expand    the collapsible (keepLayout) reveals the trace as one container; its rows do not enter again
 *   status    working → done swaps the label text through a short blur, the spinner hands over
 *             to a check that scales in from 0.5; both start from @starting-style scoped to
 *             the ready variant, so nothing plays at first paint
 *   arrival   a row that arrives later fades up alone, the rail grows to meet it (height, set by
 *             the adapter: a 1px, absolutely positioned, childless hairline; nothing reflows)
 */

export const thinkingState = tv({
  slots: {
    base: "flex flex-col w-full max-w-[380px] min-w-0 text-sm",
    /* the collapsible's label part (passed as its labelClass): the sparkle and the live label in a row */
    header: "inline-flex items-center gap-2",
    icon: [
      "inline-flex shrink-0 size-4 items-center justify-center text-[16px] text-ink-3 motion-colors-base",
      "[&>svg:not([data-slot=icon])]:size-full",
    ],
    /* the live region; its text node is swapped, never the region itself */
    label: "inline-flex min-w-0",
    /* a text that replaces another arrives out of a 2px blur, which masks the swap */
    labelText: [
      "inline-block min-w-0 overflow-hidden text-ellipsis opacity-100 [filter:blur(0)] motion-opacity-base motion-filter-base",
    ],
    rail: "relative mt-1 ms-[5px] ps-4",
    /* the hairline under the sparkle: stretched with `bottom` until the adapter has measured the
     * rows, then a height that grows to meet a row that arrives */
    /* centred under the caret, which leads the header */
    line: "absolute -top-2 bottom-1.5 start-[1.5px] w-px bg-line motion-size-move data-measured:bottom-auto",
    rows: "flex flex-col gap-1 min-w-0 py-1",
    query: [
      "flex min-h-6 min-w-0 items-center gap-2 px-1.5 text-dense text-ink-2 animate-fade-up",
      "[&>[data-slot=icon]]:shrink-0 [&>[data-slot=icon]]:text-[14px] [&>[data-slot=icon]]:text-ink-3",
      "[&>span]:min-w-0 [&>span]:overflow-hidden [&>span]:text-ellipsis [&>span]:whitespace-nowrap [&>span]:[unicode-bidi:plaintext]",
    ],
    row: [
      "flex items-center gap-2 min-h-7 w-full min-w-0 px-1.5 py-0.5 rounded-chip text-dense text-start text-inherit no-underline",
      "motion-colors-fast",
      /* rows present at first render carry --fndn-row-index; a row that arrives later enters at once */
      "animate-[fndn-fade-up_var(--fndn-duration-enter)_var(--fndn-easing-out-strong)_calc(min(var(--fndn-row-index,0),var(--fndn-motion-stagger-max))*var(--fndn-duration-stagger))_both]",
      /* links and buttons: hover, pressed (aria-pressed), press; the trace clips, so the ring sits inside */
      "[&:is(a,button)]:hover:not-aria-pressed:not-active:bg-hover",
      "aria-pressed:not-active:bg-inset",
      "[&:is(a,button)]:active:bg-hover-2",
      "[&:is(a,button)]:focus-visible:outline-offset-[-2px]",
    ],
    /* steps: a check, or a spinner on the last row while working; a check that takes over from
     * the spinner scales in */
    check: [
      "inline-flex shrink-0 size-3.5 items-center justify-center text-[14px] text-ink-3",
      "[&>[data-slot=icon]]:motion-opacity-base [&>[data-slot=icon]]:motion-transform-press",
    ],
    primary: "flex-[0_1_auto] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium text-ink [unicode-bidi:plaintext]",
    /* the detail ("1,248 line items") keeps its width up to 60% of the row; the primary yields first */
    secondary: "flex-none max-w-[60%] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-ink-2 [unicode-bidi:plaintext]",
    /* a count reads "+12480" / "-9731" on a right-to-left page too */
    diff: [
      "inline-flex shrink-0 gap-1 font-mono text-2xs tabular-nums whitespace-nowrap",
      "[&>*]:[direction:ltr] [&>*]:[unicode-bidi:isolate] [&>[data-add]]:text-green [&>[data-del]]:text-red",
    ],
    /* search: a coloured globe disc per source */
    dot: "inline-flex shrink-0 size-3.5 items-center justify-center rounded-[50%] bg-accent text-[9px] text-on-accent",
    /* decoration: fades in place, after the rows */
    more: "px-1.5 text-xs text-ink-2 animate-[fndn-fade-in_var(--fndn-duration-enter)_ease_calc(min(var(--fndn-row-index,0),var(--fndn-motion-stagger-max))*var(--fndn-duration-stagger))_both]",
  },
  variants: {
    /* appear=false (the default): the rows, query and trailer present at mount are simply there;
     * what is added later still enters. Set per part by the adapter. */
    appear: { true: {}, false: { row: "animate-none", query: "animate-none", more: "animate-none" } },
    /* working: the sparkle reads ink-2 while the label shimmers */
    working: { true: { icon: "text-ink-2" } },
    /* set after the first render: status swaps animate from @starting-style, first paint does not */
    ready: {
      true: {
        labelText: "starting:opacity-0 starting:[filter:blur(2px)]",
        check: "[&>[data-slot=icon]]:starting:opacity-0 [&>[data-slot=icon]]:starting:[transform:scale(0.5)]",
      },
    },
    /* a row whose detail is code */
    mono: { true: { secondary: "font-mono" } },
    /* search: the source disc's colour, by order */
    tone: { accent: {}, orange: { dot: "bg-orange" }, green: { dot: "bg-green" } },
    variant: {
      steps: {},
      reasoning: {
        row: "items-start",
        primary: "whitespace-normal wrap-anywhere leading-[1.6] font-normal text-ink-2",
      },
      /* an underline that draws under the source name; inside the box, so the truncation clip keeps it */
      search: {
        primary: [
          "relative after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-current",
          "after:[transform:scaleX(0)] after:origin-[left_center] [&:dir(rtl)]:after:origin-[right_center]",
          "after:motion-also-[transform_var(--fndn-duration-slow)_var(--fndn-easing-link)]",
          "[@media(hover:hover)_and_(pointer:fine)]:[[data-slot=thinking-state-row]:hover_&]:after:[transform:scaleX(1)]",
          "[[data-slot=thinking-state-row]:focus-visible_&]:after:[transform:scaleX(1)]",
        ],
      },
      coding: { row: "cursor-pointer" },
    },
  },
  defaultVariants: { variant: "steps" },
});

export type ThinkingStateRecipeProps = VariantProps<typeof thinkingState>;
