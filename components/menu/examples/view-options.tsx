import { SlidersHorizontal } from "@phosphor-icons/react";
import { Button, Menu, type MenuEntry } from "@fndn/react";

/* options keep their own state; pass onRadioChange / onCheckedChange to store them */
const items: MenuEntry[] = [
  {
    type: "radio-group",
    name: "sort",
    label: "Sort by",
    value: "deployed",
    items: [
      { value: "deployed", label: "Last deploy" },
      { value: "name", label: "Project name" },
      { value: "status", label: "Status" },
    ],
  },
  { type: "separator" },
  {
    type: "group",
    label: "Columns",
    items: [
      { type: "checkbox", value: "branch", label: "Branch", checked: true },
      { type: "checkbox", value: "author", label: "Deployed by", checked: true },
      { type: "checkbox", value: "duration", label: "Build time" },
    ],
  },
];

export default function ViewOptions() {
  return (
    <Menu items={items}>
      <Button size="sm" icon={<SlidersHorizontal data-slot="icon" weight="bold" />}>View</Button>
    </Menu>
  );
}
