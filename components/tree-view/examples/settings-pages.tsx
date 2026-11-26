import { useState } from "react";
import { TreeView, type TreeViewNode } from "@fndn/react";

const items: TreeViewNode[] = [
  { value: "general", label: "General" },
  {
    value: "members", label: "Members",
    children: [
      { value: "people", label: "People" },
      { value: "roles", label: "Roles" },
      { value: "invitations", label: "Invitations" },
    ],
  },
  { value: "billing", label: "Billing" },
  { value: "api-keys", label: "API keys" },
];

const pages: Record<string, string> = {
  general: "Workspace name, URL and default region.",
  people: "7 members. Maya Chen is the owner.",
  roles: "Owner, Admin, Developer and Viewer.",
  invitations: "2 invitations waiting, sent Nov 14, 2026.",
  billing: "Team plan, $1,240.00 a month.",
  "api-keys": "3 keys. nw_live_… was last used 2 min ago.",
};

/* the selection drives the pane: controlled, with a branch open from the start */
export default function SettingsPages() {
  const [selected, setSelected] = useState(["roles"]);
  const [expanded, setExpanded] = useState(["members"]);
  const current = selected[0] ?? "general";
  return (
    <div className="flex w-[480px] max-w-full items-start gap-6">
      <TreeView
        className="w-44 shrink-0"
        aria-label="Workspace settings"
        items={items}
        selectedValue={selected}
        onSelectedValueChange={setSelected}
        expandedValue={expanded}
        onExpandedValueChange={setExpanded}
      />
      <p className="m-0 pt-1.5 text-sm text-ink-2">{pages[current] ?? "Pick a page on the left."}</p>
    </div>
  );
}
