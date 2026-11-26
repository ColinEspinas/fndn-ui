import { tv, type VariantProps } from "../lib/tv";
import { popup } from "../lib/popup";

/* selection-actions — a pill toolbar that hangs under a text selection.
 * Placement is the Zag popover machine's (anchored to the passage, getAnchorRect = the mark).
 * The toolbar lives in a portal, so nothing below it depends on the root being an ancestor.
 * A 36px pill wraps 28px controls at a 4px inset, so the controls' pill radius stays concentric.
 *
 * Composed parts, rendered by the adapter: the actions, Keep, Discard and Try again are Buttons
 * (sm; ghost, primary for Keep), restyled by the action/keep/discard/retry slots passed as their
 * class; while a rewrite runs the status shows a Spinner (sm) and a Shimmer (fast).
 * The Buttons are marked data-selection-actions="action|keep|discard|retry". The streaming caret in
 * the mark is streaming-text's caret part (its recipe's caret slot). */

/* Keep, Discard and the actions: capped width, a 14px icon */
const PILL_BUTTON = "max-w-[200px] [&>[data-slot=button-icon]]:text-[14px]";

export const selectionActions = tv({
  slots: {
    base: "block w-full max-w-[460px] min-w-0",
    /* the passage takes focus only to hand the selection back; the selection is the indicator */
    text: [
      "m-0 text-sm leading-[1.625] text-ink wrap-anywhere outline-none focus-visible:outline-none",
      "[@media(pointer:coarse)]:text-md",
    ],
    mark: [
      "rounded-[3px] bg-transparent text-inherit [-webkit-box-decoration-break:clone] [box-decoration-break:clone]",
      "motion-colors-base",
    ],
    /* the shared popup recipe (lib/popup.ts: surface, motion from the anchor, fast exit, keyboard-instant,
     * stacking). What differs is the toolbar's own: one 36px row of controls in a pill (not the
     * card radius), the heavier overlay shadow of a surface that floats over running text, and a
     * sideways scroll instead of a tall list. */
    /* the engine's positioner (placement and stacking come from Zag and base.css). While the bar eases
     * between widths it holds the widest of them (rovingToolbar), so it only passes the pointer
     * through; the bar takes it back */
    positioner: "pointer-events-none",
    content: [
      popup(), "flex items-center gap-0.5 w-max h-9",
      "overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
      "rounded-pill shadow-overlay",
      /* on a phone the bar is wider than the screen and scrolls; the edge it continues past fades
       * into the surface, so an action cut by the edge never reads as a stray letter. Two sticky
       * veils ride the scroller's edges. Each shows while there is more on its side, at once (no
       * time involved): data-overflow-start and data-overflow-end, kept in step with the scroll
       * position by watchVeils (lib/veil.ts, from rovingToolbar). A bar that fits shows nothing. */
      "before:content-[''] before:sticky before:z-1 before:flex-[0_0_20px] before:self-stretch before:-my-1 before:pointer-events-none before:opacity-0",
      "after:content-[''] after:sticky after:z-1 after:flex-[0_0_20px] after:self-stretch after:-my-1 after:pointer-events-none after:opacity-0",
      /* the margins net to nothing with the 2px gap: the actions do not move */
      "before:-start-1 before:ms-[-4px] before:me-[-18px] before:bg-[linear-gradient(to_var(--_end,right),var(--fndn-surface),transparent)]",
      "after:-end-1 after:ms-[-18px] after:me-[-4px] after:bg-[linear-gradient(to_var(--_start,left),var(--fndn-surface),transparent)]",
      "rtl:[--_end:left] rtl:[--_start:right]",
      "data-overflow-start:before:opacity-100 data-overflow-end:after:opacity-100",
      /* a mode swap (idle → busy → result) fades the new controls in; opening is the popup's own one
       * entrance (data-swapped is set only by a swap while open); from the keyboard it is instant */
      "[&>*]:shrink-0 [&[data-swapped]>*]:animate-[fndn-fade-in_var(--fndn-duration-base)_var(--fndn-easing-out-strong)_both]",
      "[:root[data-fndn-input=keyboard]_&>*]:animate-none",
      /* the bar's width eases between modes with the controls' fade (duration.base, out-strong): the
       * rovingToolbar helper holds the old width for a frame, then sets the new one; kbd-instant (from
       * popup) makes it a snap from the keyboard.
       * fndn-check-ok: the pill has to change width between modes; it is childless of layout
       * consequence (absolutely positioned popup) and kept to duration.base */
      "motion-size-base-out mx-auto pointer-events-auto",
    ],
    action: [PILL_BUTTON, "[&>[data-slot=button-icon]]:text-ink-2"],
    status: "inline-flex items-center gap-1.5 h-7 px-2.5 text-xs whitespace-nowrap text-ink-2",
    label: "text-ink-2",
    keep: PILL_BUTTON,
    discard: PILL_BUTTON,
    separator: "w-px h-4 mx-0.5 bg-line",
    /* Try again keeps the ghost Button's own ink */
    retry: "",
  },
  variants: {
    /* the selection is highlighted while the toolbar is open */
    open: { true: { mark: "bg-accent-tint" } },
  },
});

export type SelectionActionsRecipeProps = VariantProps<typeof selectionActions>;
