import type { ComponentProps } from "react";
import { Avatar, Select } from "@fndn/react";

type Props = ComponentProps<typeof Select>;

const roles: Props["items"] = [
  { value: "owner", label: "Owner", disabled: true },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const members = [
  { name: "Maya Chen", email: "maya@northwind.example", role: "owner" },
  { name: "Daniel Okafor", email: "daniel@northwind.example", role: "admin" },
  { name: "Priya Raman", email: "priya@northwind.example", role: "viewer" },
];

/* ghost: reads as text in a dense list until it is hovered or focused */
export default function MemberRoles() {
  return (
    <ul className="m-0 flex w-full max-w-[360px] list-none flex-col gap-3 p-0">
      {members.map((member) => (
        <li key={member.email} className="flex items-center gap-3">
          <Avatar name={member.name} size={20} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium text-ink">{member.name}</span>
            <span className="truncate text-xs text-ink-2" title={member.email}>{member.email}</span>
          </div>
          <Select
            items={roles}
            defaultValue={member.role}
            size="sm"
            variant="ghost"
            placement="bottom-end"
            disabled={member.role === "owner"}
            aria-label={`Role of ${member.name}`}
          />
        </li>
      ))}
    </ul>
  );
}
