import { tv, type VariantProps } from "../lib/tv";

/* text-row — label at the start, value at the end; the workhorse of every card.
 * The label wraps when it runs out of room; the value is never truncated.
 *
 * The label, the value and its note read in their own direction ("+18%" stays "+18%" on a
 * right-to-left page, an email stays left to right); a wrapped line stays aligned to the page's
 * side (the label to the start, the values to the end), set physically from the element's own
 * direction, which plaintext does not change.
 *
 * No motion. The root slot is `base`. */

const OWN_DIRECTION = "[unicode-bidi:plaintext]";
/* aligned to the end of the page, whatever the text's own direction */
const TO_END = "[&:dir(rtl)]:text-left [&:dir(ltr)]:text-right";

export const textRow = tv({
  slots: {
    base: "flex min-w-0 min-h-11 items-center justify-between gap-4 py-2",
    label: ["flex-[1_1_0] min-w-0 text-md text-ink-2 wrap-anywhere", OWN_DIRECTION, "[&:dir(ltr)]:text-left [&:dir(rtl)]:text-right"],
    values: "flex flex-wrap items-baseline justify-end gap-x-2 min-w-0 max-w-[65%] text-end",
    value: ["text-md font-medium text-ink tabular-nums wrap-anywhere", OWN_DIRECTION, TO_END],
    meta: ["text-sm text-ink-2 whitespace-nowrap", OWN_DIRECTION, TO_END],
  },
});

export type TextRowRecipeProps = VariantProps<typeof textRow>;
