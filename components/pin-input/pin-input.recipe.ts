import { tv, type VariantProps } from "../lib/tv";

/* pin-input — a one-time code or PIN typed one character per cell (Ark UI pin-input).
 * Each cell is the real Input, square at its size's height (the shared control's: lib/control.ts):
 *   xs 24 · sm 28 (4px apart) · md 32 (default) · lg 36 (6px apart)
 * Each cell is the real Input (fill, hairline, focus and invalid rings, 16px text on touch), made
 * square, its character centred in tabular figures. On a coarse pointer a cell is 40×40, so each
 * is a whole touch target. The engine moves focus from cell to cell, takes a pasted code whole and
 * fills one-time codes from the keyboard's suggestion (otp). */
export const pinInput = tv({
  slots: {
    base: "flex flex-col gap-1.5 min-w-0 max-w-full",
    label: "text-sm font-medium text-ink [overflow-wrap:anywhere] [unicode-bidi:plaintext]",
    control: "flex flex-wrap items-center",
    /* the Input, square */
    /* typing moves focus from cell to cell: the ring must not cross-fade on every character */
    input: "kbd-instant shrink-0 w-(--control-height) px-0 text-center tabular-nums pointer-coarse:size-10",
  },
  variants: {
    size: {
      xs: { control: "gap-1" },
      sm: { control: "gap-1" },
      md: { control: "gap-1.5" },
      lg: { control: "gap-1.5" },
    },
  },
  defaultVariants: { size: "md" },
});

export type PinInputRecipeProps = VariantProps<typeof pinInput>;
