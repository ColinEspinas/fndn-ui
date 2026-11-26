import { tv, type VariantProps } from "./tv";

/* popup — the raised box of every trigger-anchored popup: select and menu content, popovers,
 * hover cards, suggestion lists, the selection toolbar. A shared recipe (no spec, no adapter):
 * a component composes it into the slot of its content element (the positioner's child, the one
 * the engine marks data-state) and adds only what is its own: width, and `--popup-max-height`
 * when the list may be taller (default 360px; the engine's --available-height still caps it).
 *
 *   content: [popup(), "w-max min-w-[120px]"]      // the outer tv merges: the component's wins
 *
 *   pointer open   opacity + transform from motion.popup-scale at duration.popup, out-strong,
 *                  growing from the trigger (--transform-origin, set by the positioner)
 *   drop           a popup as wide as its trigger (a select's or a combobox's list) scales along
 *                  the block axis only: a scale takes a share of the width, so the list of a wide
 *                  field would travel far sideways; this way its sides stay on the field's sides.
 *                  (The trigger's width cannot bound a two-axis scale instead: the positioner sets
 *                  --reference-width after the opening transition has taken its start value.)
 *   close          shorter and simpler: duration.fast
 *   keyboard       instant, open and close (kbd-instant)
 *   reduced motion popup-scale is 1, so it only fades: nothing to add
 *   mounted open   a popup already open when it mounts is drawn at once: its component marks the
 *                  content data-mounted-open until it first closes, and the entrance skips it
 *
 * A gliding highlight inside it sits 4px in, on the rows: the component gives its glide slot
 * `inset-x-1`. Tooltips and dialogs are not popups. */

export const popup = tv({
  base: [
    "relative max-w-[calc(100vw-16px)]",
    "max-h-[min(var(--available-height,var(--popup-max-height,360px)),var(--popup-max-height,360px))]",
    "overflow-y-auto overscroll-contain p-1 rounded-card bg-surface shadow-raised text-ink outline-none",
    "opacity-100 [transform:scale(1)] origin-(--transform-origin)",
    "motion-opacity-popup motion-transform-popup motion-also-[display_var(--fndn-duration-popup)_allow-discrete]",
    /* open when it mounted (data-mounted-open, set by the component until it first closes): drawn at once */
    "data-[state=open]:starting:not-data-mounted-open:opacity-0 data-[state=open]:starting:not-data-mounted-open:scale-popup",
    /* exits are shorter and simpler than entrances */
    "data-[state=closed]:opacity-0 data-[state=closed]:scale-popup data-[state=closed]:duration-fast",
    "kbd-instant",
  ],
  variants: {
    drop: {
      true: "data-[state=open]:starting:not-data-mounted-open:scale-y-popup data-[state=closed]:scale-y-popup",
    },
  },
});

export type PopupRecipeProps = VariantProps<typeof popup>;
