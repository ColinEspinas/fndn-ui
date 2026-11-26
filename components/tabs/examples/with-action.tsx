import { Plus } from "@phosphor-icons/react";
import { Button, Tabs, type TabsItem } from "@fndn/react";

const items: TabsItem[] = [
  { value: "variables", label: "Variables", content: "12 variables: 8 in every environment, 4 in Production only." },
  { value: "domains", label: "Domains", content: "app.northwind.example and 2 preview domains." },
];

/* `end` sits at the far end of the tab row: the action for the section */
export default function WithAction() {
  return (
    <Tabs
      className="w-80"
      items={items}
      defaultValue="variables"
      aria-label="Environment"
      end={<Button size="sm" variant="ghost" className="ms-auto" icon={<Plus data-slot="icon" weight="bold" />}>Add</Button>}
    />
  );
}
