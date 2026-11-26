import { ScrollArea, StatusPill } from "@fndn/react";

const previews = [
  { branch: "feat/usage-alerts", status: "Ready", tone: "green", when: "2 min ago" },
  { branch: "fix/invoice-rounding", status: "Building", tone: "accent", when: "Just now" },
  { branch: "chore/upgrade-vite", status: "Failed", tone: "red", when: "1 h ago" },
  { branch: "feat/sso", status: "Ready", tone: "green", when: "3 h ago" },
  { branch: "docs/webhook-retries", status: "Ready", tone: "green", when: "Yesterday" },
] as const;

export default function PreviewDeploys() {
  return (
    <ScrollArea orientation="horizontal" className="w-full" aria-label="Preview deployments">
      <ul className="flex w-max gap-2 pb-3">
        {previews.map((preview) => (
          <li key={preview.branch} className="flex w-44 shrink-0 flex-col gap-2 rounded-card bg-surface p-3 shadow-card">
            <p className="truncate text-sm font-medium text-ink" title={preview.branch}>{preview.branch}</p>
            <div className="flex items-center justify-between gap-2">
              <StatusPill tone={preview.tone} size="sm">{preview.status}</StatusPill>
              <span className="text-xs text-ink-2">{preview.when}</span>
            </div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
