import { Question } from "@phosphor-icons/react";
import { Button, Dialog, Kbd, TextRow } from "@fndn/react";

const shortcuts = [
  { action: "Search the workspace", keys: ["⌘", "K"] },
  { action: "Create a project", keys: ["C"] },
  { action: "Go to deploys", keys: ["G", "D"] },
  { action: "Toggle the sidebar", keys: ["⌘", "B"] },
];

/* your own trigger: a ghost Button with an icon, at the foot of the help panel */
export default function KeyboardShortcuts() {
  return (
    <div className="flex w-80 items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">Work faster</div>
        <div className="text-xs text-ink-2">Every action in Northwind has a key.</div>
      </div>
      <Dialog
        size="sm"
        title="Keyboard shortcuts"
        trigger={<Button variant="ghost" size="sm" icon={<Question data-slot="icon" weight="bold" />}>Shortcuts</Button>}
      >
        <div className="flex flex-col">
          {shortcuts.map((s) => (
            <TextRow key={s.action} label={s.action} value={<Kbd keys={s.keys} />} />
          ))}
        </div>
      </Dialog>
    </div>
  );
}
