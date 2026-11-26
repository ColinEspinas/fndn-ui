import { Button, Select } from "@fndn/react";
import { DownloadSimple } from "@phosphor-icons/react";

const statuses = ["All statuses", "Ready", "Building", "Failed", "Canceled"];
const ranges = ["Last 24 hours", "Last 7 days", "Last 30 days"];

/* sm Selects and an sm Button line up at 28px */
export default function DeployFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select items={statuses} defaultValue="All statuses" size="sm" aria-label="Status" style={{ width: 136 }} />
      <Select items={ranges} defaultValue="Last 7 days" size="sm" aria-label="Date range" style={{ width: 136 }} />
      <Button size="sm" icon={<DownloadSimple data-slot="icon" weight="bold" />}>Export</Button>
    </div>
  );
}
