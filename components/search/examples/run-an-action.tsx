import { useState } from "react";
import { Search, type SearchItem } from "@fndn/react";

/* the meta carries the shortcut; an action you may not take stays listed, disabled */
const actions: SearchItem[] = [
  { value: "Deploy web-app to Production", label: "Deploy web-app to Production", meta: "⌘D" },
  { value: "Roll back to dpl_7f3a9c", label: "Roll back to dpl_7f3a9c" },
  { value: "Copy the latest commit", label: "Copy the latest commit", meta: "⌘⇧C" },
  { value: "Delete workspace", label: "Delete workspace", meta: "Owner only", disabled: true },
];

export default function RunAnAction() {
  const [ran, setRan] = useState("");
  return (
    <div className="flex w-80 flex-col gap-2">
      <Search items={actions} label="Run an action" placeholder="Run an action…" onSelect={setRan} />
      <p className="text-xs text-ink-2">{ran ? `Started: ${ran}` : "Pick an action, or type to filter."}</p>
    </div>
  );
}
