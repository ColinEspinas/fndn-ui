import { tv, type VariantProps } from "../lib/tv";
import { control, controlSize, controlVariant } from "../lib/control";

/* input — a text field. Its label, helper and error come from a Field around it (field.recipe.ts),
 * through Ark UI's field context.
 *
 * The box is the shared control recipe (lib/control.ts): the sizes
 * (xs 24 · sm 28 · md 32 · lg 36), the looks (outline, subtle, ghost) and every state (hover,
 * focus ring for any focus, invalid, disabled, read-only, 16px and 40px on coarse pointers) are
 * its. What is here: the native input's reset, the type, the direction of the text and the
 * textarea metrics. The part is found by data-slot (input); the root slot is `base`. */

/* the field kind (the ring for any focus); size and variant are passed below */
const c = control({ kind: "field" });

export const input = tv({
  slots: {
    base: [
      c.base(),
      "appearance-none block m-0 py-0 border-0",
      "[font-weight:inherit] [font-style:inherit] tracking-[inherit] leading-[1.4] text-ellipsis",
      /* dir="auto" (every adapter sets it): the value and the placeholder read in their own
       * direction; the alignment stays on the page's side (the parent's direction, not the text's) */
      "[:dir(ltr)>&[dir=auto]]:text-left [:dir(rtl)>&[dir=auto]]:text-right",
    ],
  },
  variants: {
    /* a textarea grows from 72px and resizes vertically; its block padding centres one line of
     * text in the size's height, so its first line sits where a single-line field's text does */
    multiline: {
      true: { base: "h-auto min-h-18 leading-[1.5] resize-y" },
    },
    size: {
      xs: { base: controlSize.xs },
      sm: { base: controlSize.sm },
      md: { base: controlSize.md },
      lg: { base: controlSize.lg },
    },
    variant: {
      outline: { base: controlVariant.outline },
      subtle: { base: controlVariant.subtle },
      ghost: { base: controlVariant.ghost },
    },
    mono: {
      true: { base: "font-mono" },
      false: { base: "[font-family:inherit]" },
    },
  },
  compoundVariants: [
    { multiline: true, size: "xs", class: { base: "py-[3px]" } },
    { multiline: true, size: "sm", class: { base: "py-[5px]" } },
    { multiline: true, size: "md", class: { base: "py-[7px]" } },
    { multiline: true, size: "lg", class: { base: "py-2" } },
  ],
  defaultVariants: { size: "md", variant: "outline", mono: false, multiline: false },
});

export type InputRecipeProps = VariantProps<typeof input>;
