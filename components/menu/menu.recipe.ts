import { tv, type VariantProps } from "../lib/tv";
import { popup } from "../lib/popup";
import { option } from "../lib/option";
import { glideLayer } from "../lib/glide";

/* menu — a raised list of actions that scales out of its trigger.
 * Behaviour comes from the Zag menu machine (data-state, data-highlighted, data-disabled…).
 * The popup lives in a portal, so nothing below depends on the root being an ancestor.
 *
 * The popup surface, the option rows (with the separator and the group label) and the one gliding
 * highlight are shared (the popup and option recipes, glideLayer of lib/glide.ts), composed into the parts below; only
 * what a menu adds is written here. The positioner takes its stacking from base.css. An action's
 * tone is a variant of the item and its icon (danger: red text and icon). Parts are found by data-slot (menu, menu-content, menu-item, …); the root
 * slot is `base`.
 *
 * The default trigger is the real Button (outline, sm) with a trailing caret (its trailingIcon),
 * marked data-menu="trigger". Checkbox and radio options lead with the checkbox's and the radio's
 * own control (the item-control part), written by hand (the adapters render a whole labelled
 * control with its native input) with those recipes' classes and slots (checkbox-control and
 * checkbox-mark, radio-group-control), driven by their data-state. A sub-menu is a nested Ark menu
 * whose trigger is a row like the others, with a caret (item-caret); its popup is this same
 * recipe, and keeps the row that opened it highlighted. */

const row = option();
const danger = option({ tone: "danger" });

export const menu = tv({
  slots: {
    base: "inline-flex min-w-0",
    /* the trigger is any button; only its place in the row is ours */
    trigger: "shrink-0",
    positioner: "",
    content: [popup(), "min-w-[160px] max-w-[min(320px,calc(100vw-16px))]"],
    /* the popup's 4px: the highlight sits on the rows */
    highlight: [glideLayer, "inset-x-1"],
    group: "flex flex-col",
    label: row.label(),
    item: row.base(),
    itemIcon: row.icon(),
    itemText: row.text(),
    itemMeta: row.meta(),
    /* a row that opens a sub-menu ends with a caret pointing to the side it opens on (mirrored
     * under rtl); an icon, it is ink-3 as the row's icon is, and sits where a meta would */
    itemCaret: "inline-flex shrink-0 ms-auto text-[12px] text-ink-3 rtl:-scale-x-100 [&>[data-slot=icon]]:size-3",
    separator: row.separator(),
  },
  variants: {
    tone: {
      default: {},
      danger: { item: danger.base(), itemIcon: danger.icon() },
    },
  },
  defaultVariants: { tone: "default" },
});

export type MenuRecipeProps = VariantProps<typeof menu>;
