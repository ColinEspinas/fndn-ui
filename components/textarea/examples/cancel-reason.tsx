import { Field, Textarea } from "@fndn/react";

export default function CancelReason() {
  return (
    <Field label="Why are you cancelling?" helper="Optional. Read by the billing team, never shared." className="w-full max-w-80">
      <Textarea placeholder="Missing a feature, too expensive, moving to another tool…" />
    </Field>
  );
}
