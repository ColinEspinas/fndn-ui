import { useState } from "react";
import { Breadcrumb, Button } from "@fndn/react";

const pages = [
  { label: "Northwind", href: "/northwind" },
  { label: "mobile", href: "/northwind/mobile" },
  { label: "Deploys", href: "/northwind/mobile/deploys" },
  { label: "dpl_2c81e4", href: "/northwind/mobile/deploys/dpl_2c81e4" },
];

/* onNavigate takes over plain clicks (Cmd/Ctrl-click still opens a tab): hand them to your router */
export default function ClientRouter() {
  const [depth, setDepth] = useState(pages.length);
  const trail = pages.slice(0, depth);
  const child = pages[depth];
  return (
    <div className="flex w-80 flex-col items-start gap-3">
      <Breadcrumb
        items={trail.map((page, i) => (i === depth - 1 ? { label: page.label } : page))}
        onNavigate={(href) => setDepth(pages.findIndex((page) => page.href === href) + 1)}
      />
      {child && <Button size="sm" onClick={() => setDepth(depth + 1)}>Open {child.label}</Button>}
    </div>
  );
}
