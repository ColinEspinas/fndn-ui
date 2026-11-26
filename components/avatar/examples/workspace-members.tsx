import { Avatar } from "@fndn/react";

const members = [
  { name: "Maya Chen", email: "maya@northwind.example", role: "Owner", photo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23c9a27e'/%3E%3Ccircle cx='20' cy='16' r='8' fill='%23f6e7d8'/%3E%3Cpath d='M6 40a14 12 0 0 1 28 0z' fill='%23f6e7d8'/%3E%3C/svg%3E" },
  { name: "Daniel Okafor", email: "daniel@northwind.example", role: "Admin", color: "var(--fndn-tag-blue)" },
  { name: "Priya Raman", email: "priya@northwind.example", role: "Member", color: "var(--fndn-tag-purple)" },
];

/* a photo when there is one; initials on a colour otherwise */
export default function WorkspaceMembers() {
  return (
    <ul className="flex w-80 flex-col gap-3 text-sm">
      {members.map((member) => (
        <li key={member.email} className="flex items-center gap-2.5">
          <Avatar name={member.name} src={member.photo} color={member.color} size="20" />
          <span className="shrink-0 font-medium text-ink">{member.name}</span>
          <span className="min-w-0 truncate text-ink-2" dir="ltr" title={member.email}>{member.email}</span>
          <span className="ms-auto shrink-0 text-ink-2">{member.role}</span>
        </li>
      ))}
    </ul>
  );
}
