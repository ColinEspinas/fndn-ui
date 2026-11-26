import { GitBranch } from "@phosphor-icons/react";
import { Toggle } from "@fndn/react";

/* disabled keeps its pressed state visible and says who can change it */
export default function ViewersReadOnly() {
  return (
    <div className="flex max-w-80 flex-col items-start gap-2">
      <Toggle size="sm" disabled defaultPressed aria-describedby="auto-merge-why" icon={<GitBranch data-slot="icon" weight="bold" />}>
        Auto-merge
      </Toggle>
      <p id="auto-merge-why" className="text-sm text-ink-2">You have viewer access to web-app. Ask a maintainer to change this.</p>
    </div>
  );
}
