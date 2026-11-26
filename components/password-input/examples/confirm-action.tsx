import { Field, PasswordInput } from "@fndn/react";
import { Lock } from "@phosphor-icons/react";

/* asked again before a sensitive change; the lock marks the field as a confirmation */
export default function ConfirmAction() {
  return (
    <Field label="Confirm with your password" helper="Required to rotate the production API key." className="w-full max-w-80">
      <PasswordInput start={<Lock weight="bold" aria-hidden />} autoComplete="current-password" />
    </Field>
  );
}
