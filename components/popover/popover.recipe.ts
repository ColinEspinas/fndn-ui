import { tv, type VariantProps } from "../lib/tv";
import { popup } from "../lib/popup";

/* popover — a small raised surface anchored to its trigger: title, description, body, close.
 * Behaviour comes from the Zag popover machine (data-state on trigger and content).
 * The root is only a hook for the trigger; the surface lives in a portal.
 *
 * The surface and its motion are the shared popup recipe (lib/popup.ts), composed into the content;
 * its stacking comes from base.css; a popover keeps its own width, its roomier padding and a
 * taller limit. The close button and the default trigger are real Buttons
 * (the trigger: outline, sm, with this recipe's trigger classes as its className), marked
 * data-popover="trigger" and data-popover="close". */

export const popover = tv({
  slots: {
    base: "contents",
    /* a trigger in a toolbar keeps its size (passed to the Button trigger as its className) */
    trigger: "shrink-0",
    positioner: "max-w-[calc(100vw-16px)]",
    content: [
      popup(), "[--popup-max-height:480px]",
      "flex flex-col gap-1 w-max min-w-[200px] max-w-[min(320px,calc(100vw-16px))] p-3 text-sm leading-normal",
    ],
    header: "flex items-start justify-between gap-2",
    title: "min-w-0 m-0 text-sm font-medium leading-[1.4] text-ink wrap-anywhere",
    description: "text-xs leading-normal text-ink-2 wrap-anywhere",
    body: "mt-1 min-w-0 wrap-anywhere",
    /* the close button (ghost, xs, square, rounded, muted) reaches into the corner */
    close: "shrink-0 -my-[3px] ms-0 -me-1",
  },
});

export type PopoverRecipeProps = VariantProps<typeof popover>;
