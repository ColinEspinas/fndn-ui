import { DatePicker } from "@fndn/react";

export default function ReportPeriod() {
  return (
    <div className="flex items-center justify-between gap-4" style={{ width: 360 }}>
      <h3 className="text-sm font-medium text-ink">Revenue</h3>
      <DatePicker size="sm" variant="ghost" aria-label="Report period" selectionMode="range" defaultValue={["2026-12-01", "2026-12-31"]} placement="bottom-end" />
    </div>
  );
}
