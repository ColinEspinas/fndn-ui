import { Checkbox } from "@fndn/react";

/* tone: green for a change that adds, red for one that removes; the label says which */
export default function AccessChanges() {
  return (
    <fieldset className="flex w-80 flex-col gap-2.5">
      <legend className="mb-3 text-sm font-medium text-ink">Apply 2 access changes</legend>
      <Checkbox tone="green" defaultChecked label="Add Priya Raman to billing-api as maintainer" />
      <Checkbox tone="red" defaultChecked label="Remove Lucas Moreau from mobile" />
    </fieldset>
  );
}
