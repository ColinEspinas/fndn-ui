import { tv, type VariantProps } from "../lib/tv";

/* collapsible — a disclosure: a trigger (a real button, any content) with a caret, and a region
 * that reveals below it. Behaviour and ARIA from the Zag collapsible machine.
 *
 *   row      a whole row is the trigger (task-rows): 44px, padding 10, the caret in a 28px box at the end;
 *            the label wraps, and the caret, the meta and the label's first line share a 24px first line
 *   inline   a text-sized trigger that sits on the text line (thinking-state "Thought for 12s"):
 *            fits its content, bleeds 6px so the label aligns with the text around it
 *   section  a section header (sidebar "Chats"): 28px, 12px/500 ink-2, ink on hover
 *
 * Everything is here, motion included (`docs motion`). This recipe owns the system's one
 * reveal: `grid-rows-[0fr]` appears nowhere else.
 *   reveal   grid-template-rows 0fr → 1fr at duration.reveal easing.out-strong, opacity at
 *            duration.base ease; the rows below move with it. Opening from closed starts from
 *            @starting-style (`starting:`; the region comes out of display: none); a settled open
 *            region has no data-state, so nothing plays at first paint.
 *   exit     the engine sets data-state="closed" and waits for the content's animation to end
 *            before it sets `hidden`: fndn-collapsible-exit (duration.reveal) holds the region while
 *            the transition runs back, then the region leaves the layout and the tab order.
 *   caret    rotate 0 → 90deg (right-to-left: 180 → 90deg) at duration.move easing.out-strong
 *   keyboard the region and the caret carry kbd-instant: a toggle from the keyboard is instant
 *   keepLayout a closed region stays laid out at zero rows, unseen and out of the tab order
 *            (data-keep-layout on the root; its `display: grid !important`, which must beat
 *            base.css's `[hidden]` rule, is in the theme layer of tailwind.css)
 * Parts are found by data-slot (collapsible, collapsible-trigger, collapsible-label, …); the root
 * slot is `base`. The exit's @keyframes are in base.css. */

export const collapsible = tv({
  slots: {
    base: "flex flex-col min-w-0",
    trigger: [
      "relative flex min-w-0 items-center text-start text-inherit",
      "data-disabled:opacity-50 data-disabled:cursor-default",
      /* press darkens */
      "active:not-data-disabled:bg-hover-2",
      "motion-colors-fast",
    ],
    /* one line; a longer label truncates at the end of its own text and carries the full text as
     * a title while it is cut (lib/truncate.ts). A row's label wraps instead. */
    label: "flex-[0_1_auto] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap [unicode-bidi:plaintext]",
    /* "3 steps" keeps its own order on a right-to-left page */
    meta: "shrink-0 text-xs font-normal text-ink-2 whitespace-nowrap [unicode-bidi:plaintext]",
    /* a right caret that turns down; it points the reading direction while closed */
    caret: [
      "kbd-instant",
      "inline-flex shrink-0 items-center justify-center text-[14px] text-ink-3",
      "motion-transform-move [&:dir(rtl)]:[transform:rotate(180deg)] [[data-slot=collapsible-trigger][data-state=open]>&]:[transform:rotate(90deg)]",
    ],
    /* the region: open, closing (then closed: the engine adds `hidden` once the exit has run), and
     * opening from closed, which needs a start because it comes out of display: none */
    content: [
      "kbd-instant",
      "grid grid-rows-[1fr] opacity-100 motion-size-reveal motion-opacity-base",
      "data-[state=closed]:grid-rows-[0fr] data-[state=closed]:opacity-0",
      "data-[state=closed]:animate-[fndn-collapsible-exit_var(--fndn-duration-reveal)_linear]",
      "starting:data-[state=open]:grid-rows-[0fr] starting:data-[state=open]:opacity-0",
      /* from the keyboard the toggle is instant: the hold goes with the transition */
      "kbd:data-[state=closed]:[animation-duration:0s]",
      /* keepLayout: the closed region keeps its place, unseen */
      "[[data-keep-layout]>&[hidden]]:invisible",
    ],
    /* the clipping child */
    body: "min-w-0 min-h-0 overflow-hidden",
    text: "m-0 text-xs leading-normal text-ink-2 wrap-anywhere [unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
  },
  variants: {
    variant: {
      row: {
        /* a row may clip its content (rounded cards), so the ring sits inside the trigger */
        trigger: "w-full min-h-11 items-start gap-2.5 p-2.5 rounded-[inherit] text-sm focus-visible:outline-offset-[-2px] hover:not-data-disabled:bg-hover",
        /* plain text: the first line is 24px tall (centred on the caret), the next ones keep the body leading */
        label: "flex-[1_1_auto] min-h-6 overflow-visible wrap-anywhere whitespace-normal font-medium text-ink first-line:leading-6",
        meta: "leading-6",
        caret: "size-7 -mx-2 -my-0.5 text-[15px]",
        text: "px-2.5 pt-0 pb-2.5",
      },
      inline: {
        trigger: "w-fit max-w-[calc(100%_+_12px)] gap-2 -mx-1.5 px-1.5 py-1 rounded-control text-sm font-medium text-ink-2 hover:not-data-disabled:bg-hover",
        text: "py-1",
      },
      section: {
        trigger: "h-7 gap-1 px-1.5 rounded-control text-xs font-medium leading-none text-ink-2 hover:not-data-disabled:text-ink pointer-coarse:h-9",
        text: "px-1.5 py-1",
      },
    },
  },
  defaultVariants: { variant: "row" },
});

export type CollapsibleRecipeProps = VariantProps<typeof collapsible>;
