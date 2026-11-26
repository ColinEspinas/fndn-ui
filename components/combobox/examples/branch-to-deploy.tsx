import { Button, Combobox } from "@fndn/react";
import { RocketLaunch } from "@phosphor-icons/react";

const branches = [
  { value: "main", label: "main", meta: "2 min ago" },
  { value: "feat/usage-alerts", label: "feat/usage-alerts", meta: "1 h ago" },
  { value: "fix/invoice-rounding", label: "fix/invoice-rounding", meta: "Yesterday" },
  { value: "release/2026.11", label: "release/2026.11", meta: "Nov 12" },
  { value: "chore/upgrade-node-22-and-pnpm-11-across-workspace", label: "chore/upgrade-node-22-and-pnpm-11-across-workspace", meta: "Nov 3" },
];

/* sm: the combobox and the sm Button share the 28px row */
export default function BranchToDeploy() {
  return (
    <div className="flex items-center gap-2">
      <Combobox items={branches} defaultValue="main" size="sm" aria-label="Branch" placeholder="Search branches" style={{ width: 200 }} />
      <Button size="sm" variant="primary" icon={<RocketLaunch data-slot="icon" weight="bold" />}>Deploy</Button>
    </div>
  );
}
