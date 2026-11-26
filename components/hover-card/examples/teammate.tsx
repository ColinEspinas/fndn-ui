import { Avatar, HoverCard } from "@fndn/react";

const person = {
  name: "Priya Raman",
  role: "Staff engineer, Platform",
  email: "priya@northwind.example",
  localTime: "16:42 in Berlin",
};

export default function Teammate() {
  return (
    <div className="flex flex-wrap items-center gap-x-1 text-sm text-ink-2">
      <span>Approved by</span>
      <HoverCard
        placement="top-start"
        trigger={<button type="button" className="font-medium text-ink underline decoration-line-strong underline-offset-2">{person.name}</button>}
      >
        <div className="flex items-start gap-3">
          <Avatar name={person.name} size={20} />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-ink">{person.name}</span>
            <span className="text-ink-2">{person.role}</span>
            <span className="text-ink-2">{person.email} · {person.localTime}</span>
          </div>
        </div>
      </HoverCard>
      <span>· 2 min ago</span>
    </div>
  );
}
