import { ShareNetwork } from "@phosphor-icons/react";
import { Button, Clipboard, Popover } from "@fndn/react";

const previewUrl = "https://web-app-git-feat-usage-alerts.northwind.example";

export default function ShareLink() {
  return (
    <div className="flex w-80 items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-ink">feat/usage-alerts</span>
        <span className="text-xs text-ink-2">Preview deployed 4 min ago</span>
      </div>
      <Popover
        placement="bottom-end"
        title="Share preview"
        description="Anyone in Northwind with the link can open this preview."
        trigger={<Button size="sm" icon={<ShareNetwork data-slot="icon" weight="bold" />}>Share</Button>}
      >
        <Clipboard variant="field" value={previewUrl} aria-label="Preview link" />
      </Popover>
    </div>
  );
}
