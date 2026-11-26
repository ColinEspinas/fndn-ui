import { ArrowDown, Clock, TextAlignLeft } from "@phosphor-icons/react";
import { Toggle } from "@fndn/react";

/* icon-only toggles: ghost, muted and square; the tooltip names each one */
export default function LogOptions() {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink-2">Build log · dpl_7f3a9c</span>
      <div role="toolbar" aria-label="Log options" className="flex items-center gap-0.5">
        <Toggle variant="ghost" size="sm" square muted tooltip="Show timestamps" defaultPressed icon={<Clock data-slot="icon" weight="bold" />} />
        <Toggle variant="ghost" size="sm" square muted tooltip="Wrap long lines" icon={<TextAlignLeft data-slot="icon" weight="bold" />} />
        <Toggle variant="ghost" size="sm" square muted tooltip="Follow new output" defaultPressed icon={<ArrowDown data-slot="icon" weight="bold" />} />
      </div>
    </div>
  );
}
