import { Field, Textarea } from "@fndn/react";

export default function ProjectDescription() {
  return (
    <Field label="Description" helper="Shown on the project's overview page." className="w-full max-w-80">
      <Textarea placeholder="What this project does and who owns it" />
    </Field>
  );
}
