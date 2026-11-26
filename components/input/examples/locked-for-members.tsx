import { Field, Input } from "@fndn/react";

/* a disabled Field fades its label and control together; the helper says why */
export default function LockedForMembers() {
  return (
    <Field label="Workspace URL" helper="Only owners can change the workspace URL." disabled className="w-full max-w-80">
      <Input defaultValue="northwind" />
    </Field>
  );
}
