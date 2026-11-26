import { tv, type VariantProps } from "../lib/tv";

/* tooltip — dark chip that names a control. Never holds interactive content.
 * Behaviour comes from the Zag tooltip machine: opens after a delay on hover or keyboard focus,
 * and once one tooltip is open its neighbours open at once (data-instant).
 * The chip lives in a portal; its positioner stacks above popups and dialogs (base.css, --fndn-z-tooltip).
 * The shortcut hint is a plain `kbd` in the muted tooltip colour.
 *
 * Tooltips are not popups (no popup recipe): the chip has its own entrance. It grows from the trigger
 * at duration.tooltip and leaves at duration.fast; a neighbour of a tooltip that was just open
 * (data-instant) neither waits (engine) nor animates (here). Under the keyboard it is instant
 * (kbd-instant). The shortcut is the real Kbd, marked
 * data-tooltip="shortcut". */

export const tooltip = tv({
  slots: {
    /* the chip never takes pointer events, and neither does the box that places it */
    positioner: "pointer-events-none",
    base: [
      "kbd-instant",
      "relative inline-flex items-baseline gap-2 max-w-[min(280px,calc(100vw-16px))] px-2 py-1",
      "rounded-chip bg-tooltip-bg text-tooltip-fg shadow-[0_0_0_1px_var(--fndn-tooltip-border)]",
      "text-xs font-medium leading-[1.4] pointer-events-none select-none origin-(--transform-origin)",
      "motion-opacity-tooltip motion-transform-tooltip motion-also-[display_var(--fndn-duration-tooltip)_allow-discrete]",
      "starting:data-[state=open]:opacity-0 starting:data-[state=open]:scale-popup",
      "data-[state=closed]:opacity-0 data-[state=closed]:scale-popup data-[state=closed]:not-data-instant:duration-fast",
      "data-instant:duration-0",
    ],
    label: "min-w-0 wrap-anywhere",
    /* the plain kbd in the muted tooltip colour (passed to Kbd as className, so it wins the merge) */
    shortcut: "text-tooltip-muted",
  },
});

export type TooltipRecipeProps = VariantProps<typeof tooltip>;
