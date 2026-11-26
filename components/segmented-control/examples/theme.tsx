import { Monitor, Moon, Sun } from "@phosphor-icons/react";
import { SegmentedControl } from "@fndn/react";

/* icons: square cells; each label stays in the markup as the accessible name */
const themes = [
  { value: "light", label: "Light", icon: <Sun data-slot="icon" weight="fill" /> },
  { value: "dark", label: "Dark", icon: <Moon data-slot="icon" weight="fill" /> },
  { value: "system", label: "System", icon: <Monitor data-slot="icon" weight="bold" /> },
];

export default function Theme() {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink-2">Theme</span>
      <SegmentedControl options={themes} defaultValue="system" size="sm" icons aria-label="Theme" />
    </div>
  );
}
