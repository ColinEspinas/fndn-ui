import { Clipboard } from "@fndn/react";

/* labels name what is copied; Copy and Copied keep one width */
export default function DeployId() {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-ink-2">Deploy</span>
      <code className="font-mono text-xs text-ink">dpl_7f3a9c</code>
      <Clipboard value="dpl_7f3a9c" labels={{ copy: "Copy ID", copied: "ID copied" }} />
    </div>
  );
}
