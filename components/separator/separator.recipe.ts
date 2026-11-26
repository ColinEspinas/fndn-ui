import { tv, type VariantProps } from "../lib/tv";

/* separator — a 1px rule in the line colour, horizontal or vertical, with an optional label in the
 * middle (the "or" of a sign-in form). The model is the shared option separator and the rules
 * between menu groups (lib/option.ts: h-px bg-line); it takes no margin of its own, the caller spaces it.
 *
 * Without a label the element is the rule. With one (`labelled`, set by the adapter when it has
 * children) the element is a flex line whose ::before and ::after are the two rules, so the label
 * part is the only child. The label wraps rather than being cut; it takes at most 70% of the line
 * (a column: of the height), so the rules keep the rest, and nothing overflows when narrow. */
export const separator = tv({
  slots: {
    base: "shrink-0 border-0 bg-line",
    label: "min-w-0 text-center text-xs leading-4 text-ink-2 wrap-anywhere [unicode-bidi:plaintext]",
  },
  variants: {
    orientation: {
      horizontal: { base: "h-px w-full" },
      /* as tall as the row it sits in; h-full when its parent has a height of its own */
      vertical: { base: "w-px h-full self-stretch" },
    },
    labelled: {
      true: {
        base: [
          "flex items-center bg-transparent",
          "before:content-[''] before:flex-1 before:bg-line after:content-[''] after:flex-1 after:bg-line",
        ],
      },
    },
  },
  compoundVariants: [
    { orientation: "horizontal", labelled: true, class: { base: "h-auto gap-3 before:h-px after:h-px", label: "max-w-[70%]" } },
    { orientation: "vertical", labelled: true, class: { base: "w-auto flex-col gap-2 before:w-px after:w-px", label: "max-h-[70%]" } },
  ],
  defaultVariants: { orientation: "horizontal", labelled: false },
});

export type SeparatorRecipeProps = VariantProps<typeof separator>;
