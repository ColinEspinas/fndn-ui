import { ArrowSquareOut, Copy, File, PencilSimple, Trash } from "@phosphor-icons/react";
import { ContextMenu, type MenuEntry } from "@fndn/react";

const files = [
  { name: "deliver.ts", modified: "2 min ago" },
  { name: "retry-policy.ts", modified: "Yesterday" },
  { name: "deliver.test.ts", modified: "Nov 12" },
];

const actions: MenuEntry[] = [
  { value: "open", label: "Open", icon: <ArrowSquareOut data-slot="icon" weight="bold" /> },
  { value: "copy-path", label: "Copy path", icon: <Copy data-slot="icon" weight="bold" /> },
  { value: "rename", label: "Rename", icon: <PencilSimple data-slot="icon" weight="bold" /> },
  { type: "separator" },
  { value: "delete", label: "Delete", tone: "danger", icon: <Trash data-slot="icon" weight="bold" /> },
];

/* each row is its own area: right-click, long press or Shift+F10 opens the menu for that file */
export default function FileRows() {
  return (
    <div className="flex w-80 flex-col">
      {files.map((file) => (
        <ContextMenu key={file.name} items={actions} label={file.name} className="flex items-center gap-2 rounded-control px-2 py-1.5">
          <File className="size-4 shrink-0 text-ink-3" weight="bold" />
          <span className="flex-1 font-mono text-sm text-ink">{file.name}</span>
          <span className="text-xs text-ink-2">{file.modified}</span>
        </ContextMenu>
      ))}
    </div>
  );
}
