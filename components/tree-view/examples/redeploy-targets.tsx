import { TreeView, type TreeViewNode } from "@fndn/react";

/* Ctrl / Cmd + click or Shift + arrows add to the selection; a locked environment is disabled */
const items: TreeViewNode[] = [
  {
    value: "web-app", label: "web-app",
    children: [
      { value: "web-app/production", label: "Production" },
      { value: "web-app/staging", label: "Staging" },
    ],
  },
  {
    value: "billing-api", label: "billing-api",
    children: [
      { value: "billing-api/production", label: "Production (frozen until Nov 20)", disabled: true },
      { value: "billing-api/staging", label: "Staging" },
    ],
  },
];

export default function RedeployTargets() {
  return (
    <TreeView
      className="w-72"
      label="Redeploy to"
      selectionMode="multiple"
      defaultExpandedValue={["web-app", "billing-api"]}
      defaultSelectedValue={["web-app/staging", "billing-api/staging"]}
      items={items}
    />
  );
}
