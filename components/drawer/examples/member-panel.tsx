import { useState } from "react";
import { Avatar, Drawer, TextRow } from "@fndn/react";

const members = [
  { name: "Maya Chen", email: "maya@northwind.example", role: "Owner", lastActive: "Now" },
  { name: "Daniel Okafor", email: "daniel@northwind.example", role: "Admin", lastActive: "2 hours ago" },
  { name: "Sofia Alvarez", email: "sofia@northwind.example", role: "Viewer", lastActive: "Nov 12, 2026" },
] as const;

/* one drawer for the whole list: a row sets the member and opens it (open is controlled) */
export default function MemberPanel() {
  const [open, setOpen] = useState(false);
  const [member, setMember] = useState<(typeof members)[number]>(members[0]);
  return (
    <>
      <ul className="flex w-80 flex-col">
        {members.map((m) => (
          <li key={m.email}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-control px-2 py-1.5 text-start hover:bg-hover"
              onClick={() => { setMember(m); setOpen(true); }}
            >
              <Avatar name={m.name} size={20} />
              <span className="flex-1 text-sm font-medium text-ink">{m.name}</span>
              <span className="text-xs text-ink-2">{m.role}</span>
            </button>
          </li>
        ))}
      </ul>
      <Drawer open={open} onOpenChange={setOpen} side="end" title={member.name} description={member.email}>
        <TextRow label="Role" value={member.role} />
        <TextRow label="Last active" value={member.lastActive} />
        <TextRow label="Projects" value="web-app, billing-api" />
      </Drawer>
    </>
  );
}
