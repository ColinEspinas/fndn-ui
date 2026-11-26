import { useState } from "react";
import { ToggleGroup } from "@fndn/react";

/* one at most, and a second click clears it: a filter you can switch off */
const COUNTS: Record<string, number> = { open: 12, merged: 15, closed: 4 };
const states = [
  { value: "open", label: "Open" },
  { value: "merged", label: "Merged" },
  { value: "closed", label: "Closed" },
];

export default function PullRequestFilter() {
  const [show, setShow] = useState<string[]>(["open"]);
  const state = show[0];
  return (
    <div className="flex flex-col items-start gap-2">
      <ToggleGroup aria-label="Show pull requests" size="sm" value={show} onValueChange={setShow} items={states} />
      <p className="text-sm text-ink-2" role="status">
        {state ? `${COUNTS[state]} ${state} pull requests in billing-api` : "All 31 pull requests in billing-api"}
      </p>
    </div>
  );
}
