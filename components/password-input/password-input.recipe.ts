import { tv, type VariantProps } from "../lib/tv";

/* password-input — an InputGroup whose end addon is the show / hide Button (Ark UI's
 * password-input: the input's type, the trigger's label and aria-controls, focus kept in the
 * field when the trigger is pressed with the pointer). Every look is the InputGroup's, the Input's
 * and the Button's (ghost, xs, square, muted, as Search's clear button); the root only places
 * the group. The trigger's icon swaps at once: it states what a press will do next. */
export const passwordInput = tv({
  slots: {
    base: "flex w-full min-w-0",
    input: "",
    visibilityTrigger: "",
  },
});

export type PasswordInputRecipeProps = VariantProps<typeof passwordInput>;
