import { useRef, useState } from "react";
import { GitBranch, Globe, Plus, Terminal } from "@phosphor-icons/react";
import { Button, Tabs, Tooltip, type TabsItem } from "@fndn/react";

const page = (text: string) => <p className="py-2.5 text-sm text-ink-2">{text}</p>;
const pages: TabsItem[] = [
  { value: "deploys", label: "Deploys · web-app", icon: <Terminal data-slot="icon" />, content: page("dpl_7f3a9c is live on Production.") },
  { value: "pr-482", label: "#482 Add retry to webhook delivery", icon: <GitBranch data-slot="icon" />, content: page("2 approvals, checks passing.") },
  { value: "status", label: "Status · Northwind", icon: <Globe data-slot="icon" />, content: page("All systems operational.") },
];

/* browser tabs: closable pill tabs, each with its page's icon. A title stops at 240px, cut with its
 * full text in the title; a new tab opens its room and a closed one gives it back */
export default function BrowserTabs() {
  const [open, setOpen] = useState(pages);
  const [active, setActive] = useState("pr-482");
  const next = useRef(1);
  const add = () => {
    const value = `new-${next.current++}`;
    setOpen((tabs) => [...tabs, { value, label: "New tab", icon: <Globe data-slot="icon" />, content: page("A blank page.") }]);
    setActive(value);
  };
  return (
    <Tabs
      className="w-full max-w-[560px]"
      size="sm"
      closable
      items={open}
      value={active}
      onValueChange={setActive}
      onClose={(value) => setOpen((tabs) => tabs.filter((tab) => tab.value !== value))}
      aria-label="Open tabs"
      end={
        <Tooltip content="New tab">
          <Button variant="ghost" size="xs" square muted aria-label="New tab" icon={<Plus data-slot="icon" weight="bold" />} onClick={add} />
        </Tooltip>
      }
    />
  );
}
