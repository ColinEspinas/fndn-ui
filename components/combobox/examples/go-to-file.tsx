import { File, FileText, Gear } from "@phosphor-icons/react";
import { Combobox, type ComboboxItem } from "@fndn/react";

/* an editor's "Go to file": each file leads with its icon, its folder after it; as you type, the
 * part of each name you typed stays in ink and the rest dims, so you see why a file is listed */
const files: ComboboxItem[] = [
  { value: "src/middleware/rate-limit.ts", label: "rate-limit.ts", meta: "src/middleware", icon: <File data-slot="icon" weight="bold" /> },
  { value: "src/middleware/rate-limit.test.ts", label: "rate-limit.test.ts", meta: "src/middleware", icon: <File data-slot="icon" weight="bold" /> },
  { value: "src/webhooks/retry-policy.ts", label: "retry-policy.ts", meta: "src/webhooks", icon: <File data-slot="icon" weight="bold" /> },
  { value: "docs/rate-limits.md", label: "rate-limits.md", meta: "docs", icon: <FileText data-slot="icon" weight="bold" /> },
  { value: "config/limits.yaml", label: "limits.yaml", meta: "config", icon: <Gear data-slot="icon" weight="bold" /> },
];

export default function GoToFile() {
  return <Combobox items={files} highlightMatch aria-label="Go to file" placeholder="Go to file" emptyText="No file matches" style={{ width: 320 }} />;
}
