import { CheckCircle } from "@phosphor-icons/react";
import { Spinner } from "@fndn/react";

const deploys = [
  { id: "dpl_7f3a9c", branch: "feat/usage-alerts", building: true, status: "Building · 1m 12s" },
  { id: "dpl_51e0b2", branch: "main", building: false, status: "Ready · 2 min ago" },
  { id: "dpl_0c94d7", branch: "fix/tax-rounding", building: false, status: "Ready · 1 h ago" },
];

export default function DeployList() {
  return (
    <ul className="flex w-80 max-w-full flex-col gap-2 text-sm">
      {deploys.map((deploy) => (
        <li key={deploy.id} className="flex items-center gap-2">
          {deploy.building ? (
            <Spinner label="Building" />
          ) : (
            <CheckCircle data-slot="icon" weight="fill" className="shrink-0 text-green" aria-hidden />
          )}
          <span className="min-w-0 flex-1 truncate text-ink" title={deploy.branch}>{deploy.branch}</span>
          <span className="shrink-0 text-ink-2 tabular-nums">{deploy.status}</span>
        </li>
      ))}
    </ul>
  );
}
