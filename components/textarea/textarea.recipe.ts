import { tv, type VariantProps } from "../lib/tv";
import { input } from "../input/input.recipe";
import { control, controlSize, controlVariant } from "../lib/control";

/* textarea — Input's multiline field as a component of its own, growing with its text (Ark UI's
 * Field.Textarea with autoresize). Every class is the input recipe's (multiline: 72px minimum,
 * 1.5 leading, the block padding that centres one line in the size's height; the shared control's
 * sizes, looks, rings, hover and motion: lib/control.ts), so the two never drift; only what a
 * textarea adds is written here.
 *
 * Auto-grow: the engine sets the height from the content on every change; a max-height from the
 * caller (max-h-40) caps it and the text scrolls past it. The resize handle goes while it grows. */

/* the input recipe's md outline multiline field, without its font-family choice (the mono variant
 * below makes it, as input.recipe.ts does); size and variant below replace the md and outline classes */
const md = input({ multiline: true, size: "md" })
  .base()
  .split(" ")
  .filter((c) => c !== "[font-family:inherit]")
  .join(" ");

export const textarea = tv({
  /* the control first (what it is made of), then the multiline field, which wins where they differ
   * (h-auto, the 72px minimum) */
  base: [control({ kind: "field" }).base(), md],
  variants: {
    /* the shared control's sizes and the input recipe's multiline padding for each (input.recipe.ts) */
    size: {
      xs: [controlSize.xs, "py-[3px]"],
      sm: [controlSize.sm, "py-[5px]"],
      md: [controlSize.md, "py-[7px]"],
      lg: [controlSize.lg, "py-2"],
    },
    variant: {
      outline: controlVariant.outline,
      subtle: controlVariant.subtle,
      ghost: controlVariant.ghost,
    },
    mono: {
      true: "font-mono",
      false: "[font-family:inherit]",
    },
    autoResize: {
      true: "resize-none",
      false: "",
    },
  },
  defaultVariants: { size: "md", variant: "outline", mono: false, autoResize: true },
});

export type TextareaRecipeProps = VariantProps<typeof textarea>;
