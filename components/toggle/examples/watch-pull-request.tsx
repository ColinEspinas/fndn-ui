import { useState } from "react";
import { Bell } from "@phosphor-icons/react";
import { Toggle } from "@fndn/react";

/* a toggle keeps its label; the pressed fill and the line under it say the state */
export default function WatchPullRequest() {
  const [watching, setWatching] = useState(true);
  return (
    <div className="flex max-w-80 flex-col items-start gap-2">
      <p className="text-sm font-medium text-ink">#482 Add retry to webhook delivery</p>
      <div className="flex items-center gap-3">
        <Toggle size="sm" pressed={watching} onPressedChange={setWatching} icon={<Bell data-slot="icon" weight="bold" />}>
          Watch
        </Toggle>
        <span className="text-sm text-ink-2">{watching ? "Every review and comment" : "Only when you are mentioned"}</span>
      </div>
    </div>
  );
}
