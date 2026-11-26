import { tv, type VariantProps } from "../lib/tv";

/* field — label, control, helper text and error text around one control (Ark UI's Field: it wires
 * the label's for, the control's id, aria-describedby, aria-invalid, required and disabled). It was
 * Input's field wrapper (label, hint) made a component: the same column, the
 * same 6px gap, the same 12px ink-2 helper (text read for meaning: 4.5:1 or more) that turns into the red error when invalid.
 *
 * The label part is the Label component (marked data-field="label"); the control is whatever
 * the caller puts in (Input, Textarea, InputGroup, PasswordInput read the field
 * through Ark's context). Helper and error wrap, keep their own direction, never cut. */
export const field = tv({
  slots: {
    base: "flex flex-col gap-1.5 min-w-0",
    /* only as wide as its text: the empty end of the row is not a click target */
    label: "self-start max-w-full",
    requiredIndicator: "ms-0.5 text-red",
    helper: "m-0 text-xs text-ink-2 wrap-anywhere [unicode-bidi:plaintext] [text-align:match-parent]",
    /* an error that arrives after the field's first paint (data-enter on the root, lib/paint.ts) takes
     * its line at once and fades its ink in over duration.base; on first paint and from the
     * keyboard (kbd-instant) it is simply there */
    error: [
      "m-0 text-xs text-red wrap-anywhere [unicode-bidi:plaintext] [text-align:match-parent]",
      "opacity-100 kbd-instant [[data-slot=field][data-enter]>&]:motion-opacity-base starting:[[data-slot=field][data-enter]>&]:opacity-0",
    ],
  },
});

export type FieldRecipeProps = VariantProps<typeof field>;
