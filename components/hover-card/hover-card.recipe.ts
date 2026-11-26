import { tv, type VariantProps } from "../lib/tv";
import { popup } from "../lib/popup";

/* hover-card — a preview surface that opens when its trigger is hovered or focused and stays
 * open while the pointer is inside. Optional preview parts: a mono header (title + counts) and
 * tinted lines for a file diff; anything else goes in the body.
 * Behaviour comes from the Zag hover-card machine. The surface lives in a portal.
 *
 * The surface and its motion are the shared popup recipe (lib/popup.ts), composed into the content;
 * its stacking comes from base.css; the card keeps its width and a taller limit, and its
 * sections carry their own padding. A line's tone is a variant of the line part. */

export const hoverCard = tv({
  slots: {
    base: "contents",
    positioner: "max-w-[calc(100vw-16px)]",
    /* default trigger: a small mono chip (bring your own trigger for anything else). A block of
     * text, not a flex box, so a long file name can end in an ellipsis. Opened from the keyboard
     * (focus), it takes its open colour at once, like the card. */
    trigger: [
      "inline-block max-w-[min(100%,320px)] h-7 overflow-hidden text-ellipsis align-middle px-2",
      "rounded-chip bg-surface shadow-btn font-mono text-[11.5px] leading-7 whitespace-nowrap text-ink",
      "hover:bg-hover data-[state=open]:bg-hover active:scale-press",
      "motion-colors-fast motion-transform-press kbd-instant",
    ],
    content: [popup(), "[--popup-max-height:420px] w-72 p-0"],
    /* the title wraps, so the counts sit on its first line (same font size and line height) */
    header: "flex items-start justify-between gap-2 px-2.5 py-1.5 border-b border-line font-mono text-2xs leading-normal",
    /* the card is where a trigger's cut path is read in full: the title wraps (a path breaks
     * anywhere), it is never cut a second time */
    title: "min-w-0 wrap-anywhere text-ink-2",
    meta: "shrink-0 tabular-nums whitespace-nowrap",
    add: "text-green",
    /* after the added count */
    del: "text-red not-first:ms-1.5",
    lines: "py-1 font-mono text-2xs leading-[1.8]",
    line: [
      "flex gap-2 px-2.5 whitespace-pre text-ink-2",
    ],
    sign: "shrink-0 w-3 select-none",
    text: "min-w-0 overflow-hidden text-ellipsis",
    body: "px-3 py-2.5 text-dense leading-normal text-ink-2 wrap-anywhere",
  },
  variants: {
    tone: {
      ctx: {},
      add: { line: "bg-green-tint text-green" },
      del: { line: "bg-red-tint text-red" },
    },
  },
  defaultVariants: { tone: "ctx" },
});

export type HoverCardRecipeProps = VariantProps<typeof hoverCard>;
