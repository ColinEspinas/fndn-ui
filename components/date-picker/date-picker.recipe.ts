import { tv, type VariantProps } from "../lib/tv";
import { popup } from "../lib/popup";
import { control, controlSize, controlVariant } from "../lib/control";

/* date-picker — a date field with a calendar in a popup, on the Zag date-picker machine.
 *
 * The field is one text input in the shared control recipe (lib/control.ts, field kind: xs 24 · sm 28 ·
 * md 32 · lg 36; outline, subtle, ghost), with the calendar icon at its start (14px, ink-3, as an
 * input group's icon) and the dates in words: "Mar 10, 2025", a range as one phrase, "Mar 10 – 28,
 * 2025" (helper `date-text.ts`). The input covers the whole control and the icon is drawn over
 * its start padding without taking the pointer, so a press anywhere on the field lands in the
 * input: it opens the calendar and leaves the caret there, the dates can still be typed. The field
 * is as wide as its text unless the caller gives it a width, and never narrower: a date is never
 * cut. A text field: the accent ring shows for every kind of focus, and stays while the calendar
 * is open (focus may be in the grid, so the ring follows the root's data-state).
 *
 * The popup is the shared popup surface (it grows out of the field from the pointer, instant from
 * the keyboard) holding the calendar's views (calendar.recipe.ts, rendered by its adapter); 8px of
 * padding instead of the list's 4px, since it holds a grid, not rows. It lives in a portal: nothing
 * below depends on the root being an ancestor. defaultOpen shows it open at mount, landed (no
 * entrance, no focus taken): for a page whose subject is the calendar. */

const ctl = control({ kind: "field" });

/* the input's padding, physical like the control's input (its dir is auto): the icon's side takes
 * the control's padding, the 14px icon and an 8px gap */
const ICON_SIDE = "[:dir(ltr)>&]:pl-[calc(var(--control-px)+22px)] [:dir(rtl)>&]:pr-[calc(var(--control-px)+22px)]";
const END_SIDE = "[:dir(ltr)>&]:pr-(--control-px) [:dir(rtl)>&]:pl-(--control-px)";

export const datePicker = tv({
  slots: {
    /* never narrower than its dates (min-w-min: the input's text is its least width), so a caller's
     * width can widen the field but never cut a date */
    base: "inline-flex flex-col gap-1.5 min-w-min max-w-full",
    label: "text-sm font-medium text-ink",
    /* the shared control recipe (lib/control.ts), field kind; open, it keeps the ring while focus is in
     * the calendar (the root's data-state). The input inside draws the padding. */
    control: [
      ctl.base(), "relative flex items-center px-0 cursor-text",
      "[[data-slot=date-picker][data-state=open]_&]:bg-surface [[data-slot=date-picker][data-state=open]_&]:[box-shadow:0_0_0_1px_var(--fndn-accent),0_0_0_4px_var(--fndn-accent-tint)]",
    ],
    /* the calendar icon: drawn over the input's start padding, it never takes the pointer */
    icon: "pointer-events-none absolute inset-y-0 start-(--control-px) flex items-center text-ink-3 [&>svg]:size-[14px] [&>svg]:shrink-0",
    /* the control's bare input, over the whole control; as wide as its text (or placeholder), and
     * it grows into a wider field */
    input: [ctl.input(), "flex-[1_0_auto] w-auto min-w-auto [field-sizing:content] text-clip", ICON_SIDE, END_SIDE],
    positioner: "",
    content: [popup(), "w-max p-2 [--popup-max-height:480px]"],
  },
  variants: {
    /* the shared control's sizes and looks */
    size: {
      xs: { control: controlSize.xs },
      sm: { control: controlSize.sm },
      md: { control: controlSize.md },
      lg: { control: controlSize.lg },
    },
    variant: {
      outline: { control: controlVariant.outline },
      subtle: { control: controlVariant.subtle },
      ghost: { control: controlVariant.ghost },
    },
    /* open at mount (defaultOpen): the calendar is simply there, with no entrance, until it has been
     * painted once (the adapter clears it after the first paint, lib/paint.ts) */
    landing: { true: { content: "transition-none!" } },
  },
  defaultVariants: { size: "md", variant: "outline" },
});

export type DatePickerRecipeProps = VariantProps<typeof datePicker>;
