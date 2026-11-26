import { Columns, ListBullets, Plus } from "@phosphor-icons/react";
import { Button, SegmentedControl } from "@fndn/react";

/* sm (28px) beside an sm Button: one control height across the toolbar */
const views = [
  { value: "list", label: "List", icon: <ListBullets data-slot="icon" weight="bold" /> },
  { value: "board", label: "Board", icon: <Columns data-slot="icon" weight="bold" /> },
];

export default function ViewSwitch() {
  return (
    <div className="flex w-80 items-center justify-between gap-3">
      <SegmentedControl size="sm" options={views} defaultValue="board" aria-label="View" />
      <Button variant="primary" size="sm" icon={<Plus data-slot="icon" weight="bold" />}>New project</Button>
    </div>
  );
}
