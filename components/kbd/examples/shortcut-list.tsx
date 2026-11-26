import { Kbd } from "@fndn/react";

/* a shortcuts list: the action at the start, its keys at the end; a sequence reads "then" */
const shortcuts = [
  { action: "Search projects and people", keys: [["⌘", "K"]] },
  { action: "New project", keys: [["C"]] },
  { action: "Go to deploys", keys: [["G"], ["D"]] },
  { action: "Toggle the sidebar", keys: [["⌘", "B"]] },
];

export default function ShortcutList() {
  return (
    <dl className="flex w-80 flex-col gap-2 text-sm">
      {shortcuts.map((s) => (
        <div key={s.action} className="flex items-center justify-between gap-4">
          <dt className="text-ink-2">{s.action}</dt>
          <dd className="flex items-center gap-1 text-xs text-ink-2">
            {s.keys.map((k, i) => (
              <span key={i} className="contents">
                {i > 0 && "then"}
                <Kbd keys={k} />
              </span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
