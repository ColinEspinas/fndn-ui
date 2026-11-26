import { Clipboard } from "@fndn/react";

/* button: Copy beside a one-line command; it turns to Copied for a moment */
const command = "git checkout feat/usage-alerts";

export default function CheckoutCommand() {
  return (
    <div className="flex w-80 items-center justify-between gap-3 rounded-control bg-inset py-1 ps-3 pe-1">
      <code className="min-w-0 truncate font-mono text-xs text-ink-2" title={command}>{command}</code>
      <Clipboard value={command} />
    </div>
  );
}
