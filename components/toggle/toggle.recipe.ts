import { tv, type VariantProps } from "../lib/tv";
import { button } from "../button/button.recipe";

/* toggle — a button that stays pressed (Ark UI toggle: aria-pressed, data-state on|off). It is the
 * Button: the button recipe extended, so sizes, shapes, square, muted, the press scale and every
 * hover and motion rule come from button.recipe.ts and are never copied here. What it adds:
 *
 *  - pressed keeps the darker fill, hovered or not, the way an open ghost button keeps hover-2
 *    with aria-expanded: hover-2 for both looks (on white, the outline's open fill `hover` is
 *    too close to the surface to read as on). muted turns ink.
 *  - a change from the keyboard (Space / Enter) is instant: kbd-instant zeroes the fill's fade
 *    while the last input was the keyboard (trackModality sets it).
 *
 * Only the ghost and outline looks are a toggle's (the adapter's types say so); the others are the
 * Button's and have no pressed fill. Styled from aria-pressed, which Ark writes; data-state is not
 * used because a Tooltip around the toggle writes its own data-state on the same element. */
export const toggle = tv({
  extend: button,
  slots: {
    base: "kbd-instant",
  },
  variants: {
    variant: {
      outline: { base: "aria-pressed:bg-hover-2 aria-pressed:hover:bg-hover-2" },
      ghost: { base: "aria-pressed:bg-hover-2 aria-pressed:hover:bg-hover-2" },
    },
    muted: {
      true: { base: "aria-pressed:text-ink" },
    },
  },
  defaultVariants: { variant: "outline", size: "md" },
});

export type ToggleRecipeProps = VariantProps<typeof toggle>;
