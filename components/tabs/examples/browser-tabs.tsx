import { useState } from "react";
import { GitBranch, Globe, Terminal } from "@phosphor-icons/react";
import { Tabs, type TabsItem } from "@fndn/react";

const page = (text: string) => <p className="px-3 py-2.5 text-sm text-ink-2">{text}</p>;
const pages: TabsItem[] = [
  { value: "deploys", label: "Deploys · web-app", icon: <Terminal data-slot="icon" />, content: page("dpl_7f3a9c is live on Production.") },
  { value: "pr-482", label: "#482 Add retry to webhook delivery", icon: <GitBranch data-slot="icon" />, content: page("2 approvals, checks passing.") },
  { value: "status", label: "Status · Northwind", icon: <Globe data-slot="icon" />, content: page("All systems operational.") },
];

/* browser tabs: attached, so the selected tab is the toolbar's surface and joins it; the others sit
 * on the darker strip. Tabs share the strip (240px at most) and shrink before it scrolls */
export default function BrowserTabs() {
  const [open, setOpen] = useState(pages);
  const [active, setActive] = useState("pr-482");
  return (
    <div className="w-full max-w-[560px] overflow-hidden rounded-card bg-canvas shadow-card">
      <Tabs
        variant="attached"
        size="sm"
        closable
        items={open}
        value={active}
        onValueChange={setActive}
        onClose={(page) => setOpen((tabs) => tabs.filter((tab) => tab.value !== page))}
        aria-label="Open tabs"
      />
    </div>
  );
}
