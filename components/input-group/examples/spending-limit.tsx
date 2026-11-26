import { Field, InputGroup } from "@fndn/react";

/* text addons give the unit; inside a Field the label and helper are wired as for an Input */
export default function SpendingLimit() {
  return (
    <Field label="Spending limit" helper="Deploys pause when the month reaches it." className="w-full max-w-80">
      <InputGroup start="$" end="USD" defaultValue="1,240.00" inputMode="decimal" />
    </Field>
  );
}
