import { SidebarSimple } from "@phosphor-icons/react";
import { Button, Tooltip } from "@fndn/react";

export default function SidebarToggle() {
  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Toggle sidebar" shortcut="⌘." placement="bottom-start">
        <Button variant="ghost" size="sm" square aria-label="Toggle sidebar" icon={<SidebarSimple data-slot="icon" weight="bold" />} />
      </Tooltip>
      <span className="text-sm font-medium text-ink">Deploys</span>
    </div>
  );
}
