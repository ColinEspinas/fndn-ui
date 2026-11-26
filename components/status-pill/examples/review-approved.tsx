import { useState } from "react";
import { Button, StatusPill } from "@fndn/react";

/* the mark replaces the dot for a finished state and pops in when the status changes */
export default function ReviewApproved() {
  const [approved, setApproved] = useState(false);
  return (
    <div className="flex w-80 flex-col gap-3 text-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">Add retry to webhook delivery</p>
          <p className="text-ink-2">#482 · feat/webhook-retry into main</p>
        </div>
        {approved ? (
          <StatusPill tone="green" mark>Approved</StatusPill>
        ) : (
          <StatusPill tone="neutral">In review</StatusPill>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="primary" disabled={approved} onClick={() => setApproved(true)}>Approve</Button>
        <Button size="sm" variant="ghost" onClick={() => setApproved(false)}>Request changes</Button>
      </div>
    </div>
  );
}
