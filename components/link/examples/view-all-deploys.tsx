import { ArrowRight } from "@phosphor-icons/react";
import { Link, StatusPill } from "@fndn/react";

const DEPLOYS = [
  { id: "dpl_7f3a9c", branch: "main", status: "Failed", tone: "red" },
  { id: "dpl_6e21b4", branch: "feat/usage-alerts", status: "Ready", tone: "green" },
] as const;

export default function ViewAllDeploys() {
  return (
    <section className="flex w-80 flex-col gap-2 text-sm">
      <ul className="flex flex-col divide-y divide-line">
        {DEPLOYS.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 py-2">
            <span className="min-w-0"><span className="font-mono text-xs text-ink">{d.id}</span> <span className="text-ink-2">{d.branch}</span></span>
            <StatusPill size="sm" tone={d.tone}>{d.status}</StatusPill>
          </li>
        ))}
      </ul>
      <Link variant="standalone" href="/web-app/deploys" className="self-start">
        View all deploys <ArrowRight data-slot="icon" weight="bold" className="rtl:-scale-x-100" />
      </Link>
    </section>
  );
}
