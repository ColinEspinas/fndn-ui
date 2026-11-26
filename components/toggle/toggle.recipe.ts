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
 * ink: pressed without a fill, for activity bars, layout toggles and a browser's star. At rest ink-3,
 * hovered the ghost button's fill and ink; pressed is ink (pass the filled glyph if you want one),
 * never a grey box. `indicator` adds a 2px ink bar while pressed: at the inline start (an activity
 * bar, as VS Code) or at the bottom (a toolbar). The bar appears at once (a discrete state).
 *
 * Only the ghost, outline and ink looks are a toggle's (the adapter's types say so); the others are
 * the Button's and have no pressed fill. Styled from aria-pressed, which Ark writes; data-state is
 * not used because a Tooltip around the toggle writes its own data-state on the same element. */
export const toggle = tv({
  extend: button,
  slots: {
    base: "kbd-instant",
  },
  variants: {
    variant: {
      outline: { base: "aria-pressed:bg-hover-2 aria-pressed:hover:bg-hover-2" },
      ghost: { base: "aria-pressed:bg-hover-2 aria-pressed:hover:bg-hover-2" },
      ink: { base: "relative bg-transparent text-ink-3 shadow-none hover:bg-hover hover:text-ink active:text-ink aria-pressed:text-ink" },
    },
    /* the pressed mark of the ink look: none, a bar at the inline start, or at the bottom */
    indicator: {
      none: {},
      /* (a before: utility always creates the pseudo-element; only the pressed state paints it) */
      start: { base: "before:absolute before:start-0 before:inset-y-1 before:w-0.5 before:rounded-full aria-pressed:before:bg-ink" },
      bottom: { base: "before:absolute before:bottom-0 before:inset-x-1.5 before:h-0.5 before:rounded-full aria-pressed:before:bg-ink" },
    },
    muted: {
      true: { base: "aria-pressed:text-ink" },
    },
  },
  defaultVariants: { variant: "outline", size: "md", indicator: "none" },
});

export type ToggleRecipeProps = VariantProps<typeof toggle>;
