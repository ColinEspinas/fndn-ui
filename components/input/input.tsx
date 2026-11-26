import { Field as ArkField } from "@ark-ui/react/field";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { input } from "./input.recipe";

export type InputSize = "xs" | "sm" | "md" | "lg";
export type InputVariant = "outline" | "subtle" | "ghost";
type Shared = { size?: InputSize; variant?: InputVariant; mono?: boolean; invalid?: boolean };

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & Shared & { multiline?: false };
export type InputMultilineProps = TextareaHTMLAttributes<HTMLTextAreaElement> & Shared & { multiline: true };

/** Text field on the field color with a hairline ring.
 * Inside a Field it is wired to the field's label, helper and error
 * through Ark UI's field context (Field.Input / Field.Textarea); on its own it is a plain control. */
export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps | InputMultilineProps>(function Input(props, ref) {
  const { size = "md", variant = "outline", mono, invalid, className, ...rest } = props;
  const multiline = !!(rest as { multiline?: boolean }).multiline;
  const shared = {
    className: input({ size, variant, mono: !!mono, multiline }).base({ class: className }),
    /* the text keeps its own direction (an English value on a right-to-left page); the recipe keeps
     * the alignment on the page's side. A `dir` from the caller wins. */
    dir: "auto",
    /* only when set: an absent prop leaves the Field's aria-invalid in place */
    ...(invalid ? { "aria-invalid": true as const } : {}),
  };
  const { multiline: _multiline, ...native } = rest as { multiline?: boolean } & Record<string, unknown>;
  if (multiline) {
    return <ArkField.Textarea data-slot="input" ref={ref as React.Ref<HTMLTextAreaElement>} {...shared} {...(native as TextareaHTMLAttributes<HTMLTextAreaElement>)} />;
  }
  return <ArkField.Input data-slot="input" ref={ref as React.Ref<HTMLInputElement>} {...shared} {...(native as Omit<InputHTMLAttributes<HTMLInputElement>, "size">)} />;
});
