import { tv, type VariantProps } from "../lib/tv";
import { buttonGroup } from "../button-group/button-group.recipe";

/* toggle-group — a row of Toggles where one (or, multiple, several) stay pressed: text alignment,
 * bold / italic / underline, a view filter (Ark UI toggle-group: one tab stop, arrow keys move).
 *
 * Each item is the Toggle: the adapter gives it the toggle recipe's classes (sizes, shapes, square,
 * muted, the pressed fill, the press scale, kbd-instant), and this recipe only adds what a group
 * needs. In single mode the engine marks an item as a radio (aria-checked) rather than a toggle
 * button (aria-pressed), so the pressed look is repeated for aria-checked here, hovered or not.
 *
 * Two looks. ghost: borderless items 2px apart, as the Toggles of a toolbar are. outline: the
 * outlined items are joined into one control, exactly as a button group joins Buttons (its recipe,
 * composed: inner corners square, one hairline at each join, a focused item above its
 * neighbours), because outlined pills a hair apart read as a control that came apart.
 * Joined, an item never scales (a join would
 * open); its label and icon dip inside the still box instead, as in a button group. A vertical group stacks them at full width.
 * Styled from aria-*, never data-state: a Tooltip around an icon-only item writes its own
 * data-state on the same element. */
/* the button group's joins, for the outline look */
const JOIN = "[&>[data-slot=toggle-group-item]:active]:[transform:none]! [&>[data-slot=toggle-group-item]>*]:motion-transform-press [:root:not([data-fndn-input=keyboard])_&>[data-slot=toggle-group-item]:active>*]:scale-press-sm";

export const toggleGroup = tv({
  slots: {
    base: "inline-flex max-w-full min-w-0 items-center gap-0.5 outline-none",
    item: "aria-checked:bg-hover-2 aria-checked:hover:bg-hover-2",
    /* the Toggle's icon and label parts */
    icon: "",
    label: "",
  },
  variants: {
    orientation: {
      horizontal: { base: "flex-wrap" },
      vertical: { base: "flex-col items-stretch", item: "justify-start" },
    },
    muted: {
      true: { item: "aria-checked:text-ink" },
    },
    variant: { outline: {}, ghost: {} },
  },
  compoundVariants: [
    { variant: "outline", orientation: "horizontal", class: { base: [buttonGroup({ orientation: "horizontal" }).base(), JOIN, "gap-0 flex-wrap"] } },
    { variant: "outline", orientation: "vertical", class: { base: [buttonGroup({ orientation: "vertical" }).base(), JOIN, "gap-0"] } },
  ],
  defaultVariants: { orientation: "horizontal", muted: false, variant: "outline" },
});

export type ToggleGroupRecipeProps = VariantProps<typeof toggleGroup>;
