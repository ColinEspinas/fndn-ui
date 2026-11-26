import { tv, type VariantProps } from "../lib/tv";
import { control, controlSize, controlVariant } from "../lib/control";

const ctl = control({ kind: "field" });

/* input-group — an Input with addons joined to it: text (https://, USD), an icon, a Kbd or a
 * Button at its start or end. The group is the field: it is the shared control recipe (lib/control.ts:
 * sizes xs 24 · sm 28 · md 32 · lg 36, looks outline · subtle · ghost, the hover fill, the accent
 * ring on focus, the red ring when invalid, half opacity when disabled, the same motion), and the
 * Input inside it goes transparent (its own fill, hairline and rings are switched off by the `input` slot, merged over
 * the input recipe). The states are read from the Input itself (:focus, aria-invalid, :disabled),
 * so a Field around the group drives them too.
 *
 * Addons: text in ink-2 (a unit or a prefix says something), an icon in ink-3, as far from the
 * edge as the Input's own padding; the Input's padding on that side becomes the 8px gap. An addon that holds a Button keeps 4px around it (xs, 24px: concentric
 * with the 32px field). A click on an addon's text focuses the Input (the adapter). */
export const inputGroup = tv({
  slots: {
    /* the shared control recipe (lib/control.ts), field kind: focus anywhere in the group rings it.
     * Invalid and disabled are read from the Input (Field context or the prop), so a Field around
     * the group drives them too. The group draws the box; the Input inside draws nothing. */
    base: [
      ctl.base(), "flex items-center px-0",
      "has-[[data-slot=input][aria-invalid=true]]:[box-shadow:0_0_0_1px_var(--fndn-red)]",
      "has-[[data-slot=input][aria-invalid=true]:focus]:[box-shadow:0_0_0_1px_var(--fndn-red),0_0_0_4px_var(--fndn-red-tint)]",
      "has-[[data-slot=input]:disabled]:opacity-50 has-[[data-slot=input]:disabled]:pointer-events-none",
    ],
    /* text: one line, cut at its end past 45% of the field (the adapter adds a title while cut);
     * an icon, a Kbd or a Button: a centred row that never shrinks */
    start: [
      "min-w-0 max-w-[45%] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-ink-2 cursor-text [unicode-bidi:plaintext]",
      "has-[>*]:flex has-[>*]:items-center has-[>*]:gap-1.5 has-[>*]:overflow-visible has-[>*]:max-w-none [&>svg]:size-[14px] [&>svg]:shrink-0 [&>svg]:text-ink-3",
    ],
    end: [
      "min-w-0 max-w-[45%] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-ink-2 cursor-text [unicode-bidi:plaintext]",
      "has-[>*]:flex has-[>*]:items-center has-[>*]:gap-1.5 has-[>*]:overflow-visible has-[>*]:max-w-none [&>svg]:size-[14px] [&>svg]:shrink-0 [&>svg]:text-ink-3",
    ],
    /* merged over the input recipe (twMerge): the Input draws nothing of its own (no fill, edge,
     * ring or coarse minimum: the group has them); it keeps the size's padding on a side with no
     * addon, and 8px beside one */
    input: [
      "flex-1 h-full min-h-0 pointer-coarse:min-h-0 bg-transparent shadow-none",
      "[@media(hover:hover)_and_(pointer:fine)]:[&:where(:hover:not(:focus-visible,:has(:focus-visible),[aria-expanded=true],[readonly],[data-readonly],[aria-readonly=true]))]:bg-transparent",
      "focus-within:bg-transparent focus-within:[box-shadow:none]",
      "[&:is([aria-invalid=true],[data-invalid])]:[box-shadow:none] [&:is([aria-invalid=true],[data-invalid]):focus-within]:[box-shadow:none]",
      "disabled:opacity-100",
      "[[data-slot=input-group-start]~&]:ps-2 [&:has(~[data-slot=input-group-end])]:pe-2",
    ],
  },
  variants: {
    /* the shared control's sizes (an addon is as far from the edge as the Input's text would be;
     * one that holds a Button keeps the Button's inset: xs and sm 2px, md and lg 4px) and looks */
    size: {
      xs: { base: controlSize.xs, start: "ps-(--control-px) has-[[data-slot=button]]:ps-0", end: "pe-(--control-px) has-[[data-slot=button]]:pe-0" },
      sm: { base: controlSize.sm, start: "ps-(--control-px) has-[[data-slot=button]]:ps-0.5", end: "pe-(--control-px) has-[[data-slot=button]]:pe-0.5" },
      md: { base: controlSize.md, start: "ps-(--control-px) has-[[data-slot=button]]:ps-1", end: "pe-(--control-px) has-[[data-slot=button]]:pe-1" },
      lg: { base: controlSize.lg, start: "ps-(--control-px) has-[[data-slot=button]]:ps-1.5", end: "pe-(--control-px) has-[[data-slot=button]]:pe-1.5" },
    },
    variant: {
      outline: { base: controlVariant.outline },
      subtle: { base: controlVariant.subtle },
      ghost: { base: controlVariant.ghost },
    },
  },
  defaultVariants: { size: "md", variant: "outline" },
});

export type InputGroupRecipeProps = VariantProps<typeof inputGroup>;
