import { useState } from "react";
import { Field, PasswordInput } from "@fndn/react";

/* new-password: password managers offer to generate one; the error replaces the helper while too short */
export default function NewPassword() {
  const [password, setPassword] = useState("swordfish");
  const short = password.length > 0 && password.length < 12;
  return (
    <Field label="New password" helper="At least 12 characters." error={`Too short: ${12 - password.length} more characters.`} invalid={short} className="w-full max-w-80">
      <PasswordInput autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
    </Field>
  );
}
