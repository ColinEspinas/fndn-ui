import { tv, type VariantProps } from "../lib/tv";

/* count — number badge. Tabular numbers, one line, never shrinks: a huge number widens the badge.
 * plain is coloured text in the surrounding size; boxed is a 20px inset box; size="sm" makes plain
 * 12px text and boxed an 18px box. A signed value ("+2") reads left to right on a right-to-left
 * page too: the badge is its own left-to-right island.
 *
 * Selected: set by the prop (the `selected` variant), or taken by itself inside a selected chip, tab or
 * segment (data-state="checked", aria-selected / -checked / -pressed), so the host never has to
 * mirror its state. A boxed count takes the field fill and ink. A plain count does not change: it
 * stays ink-2, so beside a selected label (ink) it is the quieter of the two. The colour, fill
 * and ring change at the base pace (motion-colors-base, motion-shadow-base). One element, so the
 * recipe is `base` only. */

export const count = tv({
  /* a width from the host (a 24px slot) never cuts the number: the badge grows past it */
  base: "inline-flex shrink-0 min-w-max items-center justify-center leading-none tabular-nums whitespace-nowrap [unicode-bidi:isolate] [direction:ltr] motion-colors-base motion-shadow-base",
  variants: {
    variant: {
      plain: "text-ink-2",
      /* the square around one digit: min-width replaces max-content, a boxed count takes no width
       * from its host */
      boxed: [
        "min-w-5 h-5 px-1.5 rounded-chip bg-inset shadow-hairline text-2xs font-medium text-ink-2",
        "[:is([data-state=checked],[aria-selected=true],[aria-checked=true],[aria-pressed=true])_&]:bg-field",
        "[:is([data-state=checked],[aria-selected=true],[aria-checked=true],[aria-pressed=true])_&]:shadow-none",
        "[:is([data-state=checked],[aria-selected=true],[aria-checked=true],[aria-pressed=true])_&]:text-ink",
      ],
    },
    size: {
      md: "",
      sm: "text-xs",
    },
    selected: { true: "" },
  },
  compoundVariants: [
    { variant: "boxed", size: "sm", class: "min-w-[18px] h-[18px] px-[5px] text-2xs" },
    { variant: "boxed", selected: true, class: "bg-field shadow-none text-ink" },
  ],
  defaultVariants: { variant: "plain", size: "md", selected: false },
});

export type CountRecipeProps = VariantProps<typeof count>;
