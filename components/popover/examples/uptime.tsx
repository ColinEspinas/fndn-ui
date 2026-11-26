import { Info } from "@phosphor-icons/react";
import { Button, Popover } from "@fndn/react";

/* a short explanation, no title or close button: Escape or a click outside closes it */
export default function Uptime() {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-ink-2">Uptime, last 30 days</span>
      <span className="text-sm font-medium text-ink">98.2%</span>
      <Popover
        closable={false}
        placement="top"
        trigger={<Button variant="ghost" size="xs" square muted aria-label="How uptime is measured" icon={<Info data-slot="icon" weight="bold" />} />}
      >
        Checked every minute from Frankfurt, Virginia and Singapore. Planned maintenance on Nov 9 is not counted.
      </Popover>
    </div>
  );
}
