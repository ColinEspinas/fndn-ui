import { SegmentedControl } from "@fndn/react";

/* fill: equal segments across a settings panel; an option the plan lacks is disabled and explained */
const frequencies = [
  { value: "hourly", label: "Hourly", disabled: true },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export default function BackupFrequency() {
  return (
    <div className="flex w-80 flex-col gap-2">
      <p id="backup-label" className="text-sm font-medium text-ink">Database backups</p>
      <SegmentedControl fill options={frequencies} defaultValue="daily" aria-labelledby="backup-label" />
      <p className="text-xs text-ink-2">Hourly backups are on the Business plan.</p>
    </div>
  );
}
