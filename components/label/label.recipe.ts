import { tv, type VariantProps } from "../lib/tv";

/* label — the name of a form control: the label of Input's former field wrapper (text-sm,
 * font-medium, ink), as a component of its own. Ark UI's Field.Label: inside a Field it is wired
 * to the control (for / id) and carries data-disabled / data-invalid / data-required; on its own
 * it is a plain <label> (give it htmlFor).
 *
 * Author text keeps its own direction and wraps rather than being cut (a name is never shortened);
 * an unbreakable one breaks anywhere. A disabled field's label fades with its control. */
export const label = tv({
  base: [
    "text-sm font-medium text-ink wrap-anywhere [unicode-bidi:plaintext] [text-align:match-parent]",
    "data-disabled:opacity-50",
  ],
});

export type LabelRecipeProps = VariantProps<typeof label>;
