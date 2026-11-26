import { useState } from "react";
import { Separator, Switch } from "@fndn/react";

/* a settings list: label at the start, switch at the end of each row */
const settings = [
  { id: "deploy-failed", label: "A deploy fails" },
  { id: "review-requested", label: "Someone requests your review" },
  { id: "weekly-usage", label: "Weekly usage summary for Northwind" },
];

export default function Notifications() {
  const [on, setOn] = useState<Record<string, boolean>>({ "deploy-failed": true, "review-requested": true, "weekly-usage": false });
  return (
    <div className="flex w-80 flex-col">
      {settings.map((s, i) => (
        <div key={s.id}>
          {i > 0 && <Separator className="my-2" />}
          <div className="flex items-center justify-between gap-4">
            <span id={s.id} className="text-sm text-ink">{s.label}</span>
            <Switch size="sm" aria-labelledby={s.id} checked={on[s.id]} onCheckedChange={(v) => setOn({ ...on, [s.id]: v })} />
          </div>
        </div>
      ))}
    </div>
  );
}
