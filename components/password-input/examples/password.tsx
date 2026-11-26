import { Field, PasswordInput } from "@fndn/react";

/* the eye button shows the password while you check it; current-password lets managers fill it */
export default function Password() {
  return (
    <Field label="Password" className="w-full max-w-80">
      <PasswordInput autoComplete="current-password" defaultValue="tidal-ledger-9-orbit" />
    </Field>
  );
}
