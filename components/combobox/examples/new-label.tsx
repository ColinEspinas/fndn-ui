import { useState } from "react";
import { Tag } from "@phosphor-icons/react";
import { Combobox } from "@fndn/react";

/* allowCustomValue: Enter on a name no label has keeps it; the handler adds it to the list */
export default function NewLabel() {
  const [labels, setLabels] = useState(["bug", "feature", "docs", "performance", "good first issue"]);
  const [label, setLabel] = useState<string | null>(null);
  const choose = (next: string | null) => {
    if (next && !labels.includes(next)) setLabels([...labels, next]);
    setLabel(next);
  };
  return (
    <Combobox
      items={labels}
      value={label}
      onValueChange={choose}
      allowCustomValue
      label="Label"
      placeholder="Find or create a label"
      emptyText="No such label: press Enter to create it"
      start={<Tag data-slot="icon" weight="bold" />}
      style={{ width: 260 }}
    />
  );
}
