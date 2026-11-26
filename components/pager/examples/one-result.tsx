import { Pager } from "@fndn/react";

/* with a single page both buttons are disabled, and the pager stays in its place */
export default function OneResult() {
  return (
    <div className="flex w-80 items-center justify-between gap-3">
      <span className="text-sm text-ink-2">1 deploy matches “usage-alerts”</span>
      <Pager count={1} label="Matching deploys" prevLabel="Previous match" nextLabel="Next match" />
    </div>
  );
}
