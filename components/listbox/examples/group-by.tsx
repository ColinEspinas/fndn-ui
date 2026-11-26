import { Listbox } from "@fndn/react";

/* sm: the dense size for side panels and popovers */
export default function GroupBy() {
  return (
    <Listbox items={["Project", "Environment", "Author", "No grouping"]} size="sm" label="Group deploys by" defaultValue={["Environment"]} style={{ width: 180 }} />
  );
}
