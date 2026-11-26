import { Tabs, type TabsItem } from "@fndn/react";

/* pill tabs switch what one card shows: here, which log */
const items: TabsItem[] = [
  { value: "build", label: "Build", content: "10:42:48 Build finished in 47s. 312 files, 4.1 MB." },
  { value: "runtime", label: "Runtime", content: "10:51:03 POST /api/webhooks 200 in 84 ms" },
  { value: "edge", label: "Edge", content: "Cache hit rate 92.4% across 3 regions." },
];

export default function LogSource() {
  return <Tabs className="w-80" items={items} defaultValue="build" aria-label="Logs" />;
}
