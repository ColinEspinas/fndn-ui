import { HoverCard, StatusPill } from "@fndn/react";

export default function PullRequest() {
  return (
    <div className="flex w-80 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-2">
      <span>Daniel Okafor opened</span>
      <HoverCard triggerLabel="#482" title="feat/webhook-retry → main" add={128} del={14}>
        <div className="flex flex-col gap-2">
          <span className="font-medium text-ink">Add retry to webhook delivery</span>
          <span className="text-ink-2">Retries failed deliveries 5 times with backoff, then marks the endpoint unhealthy.</span>
          <StatusPill tone="green" className="self-start">Checks passing</StatusPill>
        </div>
      </HoverCard>
      <span>2 hours ago</span>
    </div>
  );
}
