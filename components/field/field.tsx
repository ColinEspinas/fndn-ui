import { Field as ArkField } from "@ark-ui/react/field";
import { forwardRef, useEffect, useState, type HTMLAttributes, type ReactNode } from "react";
import { afterPaint } from "../lib/paint";
import { trackModality } from "../lib/modality";
import { field } from "./field.recipe";
import { Input } from "../input/input";
import { Label } from "../label/label";

export type FieldProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "id"> & {
  /** The control's name, shown above it (a Label wired to the control). */
  label?: ReactNode;
  /** Help under the control, linked by aria-describedby. Replaced by the error while invalid. */
  helper?: ReactNode;
  /** What to fix, shown in red under the control while invalid (aria-live polite). */
  error?: ReactNode;
  /** Marks the control aria-invalid (red ring) and shows the error. */
  invalid?: boolean;
  /** The control is required; the label shows an asterisk (hidden from assistive technology). */
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** id of the control; generated when omitted. */
  id?: string;
  /** The control: Input, Textarea, InputGroup, PasswordInput (they read the field). An Input when omitted. */
  children?: ReactNode;
};

const shown = (node: ReactNode) => node != null && node !== false && node !== "";

/** Label, control, helper and error, wired together. Behaviour by Ark UI (field). */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  { label, helper, error, invalid, required, disabled, readOnly, id, className, children, ...rest },
  ref,
) {
  const r = field();
  /* an error that arrives later fades in; nothing on the first paint (data-enter after it, lib/paint.ts) */
  const [enter, setEnter] = useState(false);
  useEffect(() => (enter ? undefined : afterPaint(() => setEnter(true))), [enter]);
  useEffect(() => trackModality(), []);
  const showError = !!invalid && shown(error);
  return (
    <ArkField.Root
      ref={ref}
      id={id}
      invalid={!!invalid}
      required={!!required}
      disabled={!!disabled}
      readOnly={!!readOnly}
      data-slot="field"
      data-enter={enter ? "" : undefined}
      className={r.base({ class: className })}
      {...rest}
    >
      {shown(label) && (
        <Label data-field="label" className={r.label()}>
          {label}
          <ArkField.RequiredIndicator data-slot="field-required-indicator" className={r.requiredIndicator()} />
        </Label>
      )}
      {children ?? <Input />}
      {shown(helper) && !showError && <ArkField.HelperText data-slot="field-helper" className={r.helper()}>{helper}</ArkField.HelperText>}
      {showError && <ArkField.ErrorText data-slot="field-error" className={r.error()}>{error}</ArkField.ErrorText>}
    </ArkField.Root>
  );
});
