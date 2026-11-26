import { useState } from "react";
import { Button, Splitter } from "@fndn/react";

const panels = [
  { id: "pull-request", content: "#482 Add retry to webhook delivery. Daniel Okafor wants to merge 3 commits into main.", minSize: 20 },
  { id: "change", content: "src/webhooks/deliver.ts, +4 −1: a failed delivery now retries five times with exponential backoff.", minSize: 25 },
  { id: "checks", content: "Build passed, 12 tests passed, preview ready.", minSize: 20 },
];
const initial = [30, 40, 30];

export default function ReviewLayout() {
  const [size, setSize] = useState(initial);
  return (
    <div className="flex w-full max-w-xl flex-col items-start gap-3">
      <div className="h-44 w-full rounded-card bg-surface shadow-card">
        <Splitter grip panels={panels} size={size} onSizeChange={setSize} />
      </div>
      <Button size="sm" onClick={() => setSize(initial)}>Reset layout</Button>
    </div>
  );
}
