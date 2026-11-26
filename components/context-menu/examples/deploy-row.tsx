import { ArrowsClockwise, Copy, Terminal, Trash } from "@phosphor-icons/react";
import { ContextMenu, StatusPill, type MenuEntry } from "@fndn/react";

const items: MenuEntry[] = [
  { value: "logs", label: "View build logs", icon: <Terminal data-slot="icon" weight="bold" /> },
  { value: "copy-id", label: "Copy deploy ID", icon: <Copy data-slot="icon" weight="bold" /> },
  {
    type: "submenu",
    label: "Redeploy to",
    icon: <ArrowsClockwise data-slot="icon" weight="bold" />,
    items: [
      { value: "redeploy:production", label: "Production" },
      { value: "redeploy:staging", label: "Staging" },
      { value: "redeploy:preview", label: "Preview" },
    ],
  },
  { type: "separator" },
  { value: "delete", label: "Delete deploy", tone: "danger", icon: <Trash data-slot="icon" weight="bold" /> },
];

export default function DeployRow() {
  return (
    <ContextMenu items={items} label="Deploy dpl_7f3a9c" className="flex w-80 items-center gap-3 rounded-control px-2 py-1.5">
      <StatusPill tone="green">Ready</StatusPill>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="font-mono text-sm text-ink">dpl_7f3a9c</span>
        <span className="text-xs text-ink-2">main · a1b2c3d</span>
      </div>
      <span className="text-xs text-ink-2">2 min ago</span>
    </ContextMenu>
  );
}
