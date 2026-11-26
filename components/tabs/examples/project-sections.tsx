import { Tabs, type TabsItem } from "@fndn/react";

const items: TabsItem[] = [
  { value: "overview", label: "Overview", content: "web-app is live on Production. Last deploy 2 min ago by Maya Chen." },
  { value: "deploys", label: "Deploys", content: "24 deploys in the last 7 days, 1 failed on feat/usage-alerts." },
  { value: "settings", label: "Settings", content: "Build command, environment variables and domains." },
];

export default function ProjectSections() {
  return <Tabs className="w-80" items={items} defaultValue="overview" variant="underline" aria-label="web-app" />;
}
