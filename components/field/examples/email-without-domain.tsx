import { useState } from "react";
import { Field, Input } from "@fndn/react";

/* invalid: the control's ring turns red and the error takes the helper's place */
export default function EmailWithoutDomain() {
  const [email, setEmail] = useState("daniel@northwind");
  const invalid = email !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  return (
    <Field
      label="Invite by email"
      helper="They get a link to join Northwind."
      error="Add the domain, like daniel@northwind.example."
      invalid={invalid}
      className="w-full max-w-80"
    >
      <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
    </Field>
  );
}
