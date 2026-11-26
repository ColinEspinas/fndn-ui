import { Field, Input } from "@fndn/react";

/* read-only: the value can be selected and copied, not changed (unlike disabled, it stays in the tab order) */
export default function WorkspaceId() {
  return (
    <Field label="Workspace ID" helper="Support may ask for it." readOnly className="w-full max-w-80">
      <Input mono defaultValue="ws_8f2k1m9q4t" />
    </Field>
  );
}
