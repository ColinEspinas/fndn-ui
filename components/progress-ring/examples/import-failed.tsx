import { Button, ProgressRing } from "@fndn/react";

export default function ImportFailed() {
  return (
    <div className="flex w-80 items-center gap-3 text-sm">
      <ProgressRing progress={0.42} tone="red" label="Import stopped at 42%">!</ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">Import stopped at 42%</p>
        <p className="text-ink-2">data-pipeline lost its connection after 18,240 of 43,500 events.</p>
      </div>
      <Button size="sm">Retry</Button>
    </div>
  );
}
