import { Field, Input } from "@fndn/react";

/* an Input almost always sits in a Field: the label and the helper are wired to it */
export default function ProjectName() {
  return (
    <Field label="Project name" helper="Used in URLs and the CLI: lowercase and dashes." className="w-full max-w-80">
      <Input defaultValue="billing-api" autoComplete="off" />
    </Field>
  );
}
