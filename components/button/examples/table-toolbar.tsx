import { CaretDown, FunnelSimple, Plus } from "@phosphor-icons/react";
import { Button } from "@fndn/react";

/* sm (28px) in a toolbar above a table: every control of the row shares the size */
export default function TableToolbar() {
  return (
    <div className="flex w-80 items-center gap-2">
      <Button size="sm" icon={<FunnelSimple data-slot="icon" weight="bold" />}>Filter</Button>
      <Button size="sm" trailingIcon={<CaretDown data-slot="icon" weight="bold" />}>Newest</Button>
      <Button variant="primary" size="sm" className="ms-auto" icon={<Plus data-slot="icon" weight="bold" />}>New project</Button>
    </div>
  );
}
