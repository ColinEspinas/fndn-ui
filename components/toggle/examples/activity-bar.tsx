import { useState } from "react";
import { Folder, GitBranch, MagnifyingGlass, Terminal } from "@phosphor-icons/react";
import { Toggle } from "@fndn/react";

const views = [
  { value: "explorer", label: "Explorer", Icon: Folder },
  { value: "search", label: "Search", Icon: MagnifyingGlass },
  { value: "source-control", label: "Source control", Icon: GitBranch },
  { value: "terminal", label: "Terminal", Icon: Terminal },
];

/* an editor's activity bar: muted ghost toggles. The open view keeps the pressed fill and its ink;
 * pressing it again closes the side bar */
export default function ActivityBar() {
  const [view, setView] = useState<string | null>("explorer");
  return (
    <div role="toolbar" aria-orientation="vertical" aria-label="Views" className="flex w-11 flex-col items-center gap-1 rounded-card bg-canvas py-1.5">
      {views.map(({ value, label, Icon }) => (
        <Toggle
          key={value}
          variant="ghost"
          size="md"
          shape="rounded"
          square
          muted
          tooltip={label}
          pressed={view === value}
          onPressedChange={(pressed) => setView(pressed ? value : null)}
          icon={<Icon data-slot="icon" weight="bold" />}
        />
      ))}
    </div>
  );
}
