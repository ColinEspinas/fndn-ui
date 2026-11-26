import { Label, NumberInput } from "@fndn/react";

/* sm in a settings row: the Label points at the input by id */
export default function WebhookRetries() {
  return (
    <div className="flex w-full max-w-80 items-center justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label htmlFor="webhook-retries">Retries</Label>
        <span className="text-xs text-ink-2">Before a delivery is marked failed.</span>
      </div>
      <NumberInput id="webhook-retries" size="sm" defaultValue="5" min={0} max={10} className="w-24 shrink-0" />
    </div>
  );
}
