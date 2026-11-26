import { Tabs, type TabsItem } from "@fndn/react";

/* Analytics is on the Business plan: the tab stays in its place, disabled */
const items: TabsItem[] = [
  { value: "usage", label: "Usage", content: "1.2 M requests and 38 GB of bandwidth this month." },
  { value: "analytics", label: "Analytics", content: "Visitors, pages and referrers.", disabled: true },
  { value: "invoices", label: "Invoices", content: "INV-2024-0117 · $1,240.00 · Paid Nov 1, 2026" },
];

export default function PlanLocked() {
  return <Tabs className="w-80" items={items} defaultValue="usage" variant="underline" aria-label="Billing" />;
}
