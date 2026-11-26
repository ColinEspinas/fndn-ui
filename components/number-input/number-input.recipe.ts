import { tv, type VariantProps } from "../lib/tv";

/* number-input — a number field with a minus and a plus button inside its end (Ark UI number-input).
 * The field is the real Input, so its sizes and looks are the shared control's (lib/control.ts):
 *   xs  24px field · 18px buttons, 3px from the edge
 *   sm  28px field · 20px buttons, 4px from the edge
 *   md  32px field (default) · 24px buttons, 4px from the edge
 *   lg  36px field · 24px buttons, 6px from the edge
 * The field is the real Input (its fill, hairline, rings, invalid and 16px text on touch) with room
 * kept at its end for the two buttons. The buttons are real Buttons (ghost, muted, rounded: the
 * chip radius, concentric with the field's control radius), laid over that room; the engine keeps
 * them out of the tab order (the arrow keys step) and disables the one at a bound. Figures are
 * tabular, so stepping never makes the value jitter in width.
 *
 * Touch: each button's hit area reaches 8px above and below on a coarse pointer (40px high);
 * side by side they stay 24px wide each. */
export const numberInput = tv({
  slots: {
    base: "flex flex-col gap-1.5 w-full min-w-0",
    label: "text-sm font-medium text-ink [overflow-wrap:anywhere] [unicode-bidi:plaintext]",
    control: "relative w-full min-w-0",
    /* the Input */
    input: "tabular-nums",
    /* the Buttons */
    decrementTrigger: "absolute top-1/2 -translate-y-1/2 pointer-coarse:after:content-[''] pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2",
    incrementTrigger: "absolute top-1/2 -translate-y-1/2 pointer-coarse:after:content-[''] pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:-inset-y-2",
  },
  variants: {
    size: {
      xs: { input: "pe-[42px]", decrementTrigger: "size-[18px] min-h-[18px] end-[21px]", incrementTrigger: "size-[18px] min-h-[18px] end-[3px]" },
      sm: { input: "pe-12", decrementTrigger: "size-5 min-h-5 end-6", incrementTrigger: "size-5 min-h-5 end-1" },
      md: { input: "pe-14", decrementTrigger: "end-7", incrementTrigger: "end-1" },
      lg: { input: "pe-15", decrementTrigger: "end-[30px]", incrementTrigger: "end-1.5" },
    },
  },
  defaultVariants: { size: "md" },
});

export type NumberInputRecipeProps = VariantProps<typeof numberInput>;
