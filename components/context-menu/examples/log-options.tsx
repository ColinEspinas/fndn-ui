import { ContextMenu, type MenuEntry } from "@fndn/react";

const lines = [
  "10:42:01 Installing dependencies",
  "10:42:19 Building web-app",
  "10:42:48 Build finished in 47s",
];

/* view options of the area itself: they keep their own state unless you pass the handlers */
const items: MenuEntry[] = [
  { type: "checkbox", value: "wrap", label: "Wrap long lines", checked: true },
  { type: "checkbox", value: "timestamps", label: "Show timestamps", checked: true },
  { type: "separator" },
  {
    type: "radio-group",
    name: "level",
    label: "Show",
    value: "all",
    items: [
      { value: "all", label: "Every line" },
      { value: "warnings", label: "Warnings and errors" },
      { value: "errors", label: "Errors only" },
    ],
  },
];

export default function LogOptions() {
  return (
    <ContextMenu items={items} label="Build log" className="flex w-80 flex-col gap-1 rounded-card bg-inset p-3 font-mono text-xs text-ink-2">
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </ContextMenu>
  );
}
