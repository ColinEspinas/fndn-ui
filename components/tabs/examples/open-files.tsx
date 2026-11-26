import { useState } from "react";
import { Tabs, type TabsItem } from "@fndn/react";

const files: TabsItem[] = [
  { value: "src/middleware/rate-limit.ts", label: "rate-limit.ts", content: "src/middleware/rate-limit.ts · 84 lines · modified" },
  { value: "src/routes/invoices.ts", label: "invoices.ts", content: "src/routes/invoices.ts · 212 lines" },
  { value: "test/rate-limit.test.ts", label: "rate-limit.test.ts", content: "test/rate-limit.test.ts · 3 failing tests" },
  { value: "src/webhooks/deliver.ts", label: "deliver.ts", content: "src/webhooks/deliver.ts · retry added in #482" },
  { value: "package.json", label: "package.json", content: "package.json · billing-api 2.14.0" },
];

/* closable tabs: the close button, or Delete on the focused tab; the strip scrolls and keeps the
 * selected file in view. Removing the item is yours: the neighbour is already selected */
export default function OpenFiles() {
  const [open, setOpen] = useState(files);
  const [active, setActive] = useState(files[0]!.value);
  if (!open.length) return <p className="w-80 text-sm text-ink-2">No open files</p>;
  return (
    <Tabs
      className="w-80"
      variant="underline"
      closable
      items={open}
      value={active}
      onValueChange={setActive}
      onClose={(path) => setOpen((tabs) => tabs.filter((tab) => tab.value !== path))}
      aria-label="Open files"
    />
  );
}
