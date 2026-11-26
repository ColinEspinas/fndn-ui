import { useState } from "react";
import { User } from "@phosphor-icons/react";
import { Avatar, Combobox } from "@fndn/react";

const members = [
  { value: "maya", label: "Maya Chen", meta: "Owner" },
  { value: "daniel", label: "Daniel Okafor", meta: "Admin" },
  { value: "priya", label: "Priya Raman", meta: "Member" },
  { value: "lucas", label: "Lucas Moreau", meta: "Member" },
  { value: "aiko", label: "Aiko Tanaka", meta: "Member" },
  { value: "jonas", label: "Jonas Weber", meta: "Member" },
];

/* a property row of an issue: ghost and without a caret it reads as text until touched;
 * the start shows who is assigned (the name is already the field's text, so it is decorative) */
export default function AssigneeInSidePanel() {
  const [assignee, setAssignee] = useState<string | null>("priya");
  const person = members.find((member) => member.value === assignee);
  return (
    <div className="flex items-center gap-2 text-sm" style={{ width: 280 }}>
      <span className="w-20 shrink-0 text-ink-2">Assignee</span>
      <Combobox
        items={members}
        value={assignee}
        onValueChange={setAssignee}
        aria-label="Assignee"
        placeholder="Unassigned"
        emptyText="No one in Northwind matches"
        size="sm"
        variant="ghost"
        caret={false}
        start={person ? <Avatar name={person.label} size="16" aria-hidden="true" /> : <User data-slot="icon" weight="bold" />}
        className="flex-1"
      />
    </div>
  );
}
