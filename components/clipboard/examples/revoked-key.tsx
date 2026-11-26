import { Clipboard } from "@fndn/react";

/* disabled: a revoked key stays visible for reference but cannot be copied */
export default function RevokedKey() {
  return (
    <div className="flex w-80 flex-col gap-1.5">
      <Clipboard variant="field" label="Previous API key" value="nw_live_9Qx3Lm7Ty2Pd8KcW" disabled />
      <p className="text-xs text-ink-2">Revoked on Nov 14, 2026 by Maya Chen.</p>
    </div>
  );
}
