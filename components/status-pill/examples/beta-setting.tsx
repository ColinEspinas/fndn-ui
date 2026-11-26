import { StatusPill, Switch } from "@fndn/react";

export default function BetaSetting() {
  return (
    <div className="flex w-80 items-start gap-3 text-sm">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-medium text-ink">
          Usage alerts <StatusPill tone="blue" size="sm" dot={false}>Beta</StatusPill>
        </p>
        <p className="text-ink-2">Email the owners when a project passes 80% of its build minutes.</p>
      </div>
      <Switch label="Usage alerts" />
    </div>
  );
}
