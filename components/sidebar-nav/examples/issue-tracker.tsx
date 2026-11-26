import type { ComponentProps, MouseEvent } from "react";
import { useState } from "react";
import { SidebarNav } from "@fndn/react";

type Props = ComponentProps<typeof SidebarNav>;

const workspaces: Props["workspaces"] = [{ value: "northwind", label: "Northwind" }];

const items: Props["items"] = [
  { value: "inbox", label: "Inbox", href: "/inbox", icon: "bell", badge: "4" },
  { value: "my-issues", label: "My issues", href: "/my-issues", icon: "note-pencil" },
];

/* every link has an icon, so the rail keeps one text edge */
const sections: Props["sections"] = [
  {
    value: "projects",
    label: "Projects",
    items: [
      { value: "web-app", label: "web-app", href: "/projects/web-app", icon: "cube" },
      { value: "billing-api", label: "billing-api", href: "/projects/billing-api", icon: "cube" },
      { value: "data-pipeline", label: "data-pipeline", href: "/projects/data-pipeline", icon: "cube" },
    ],
  },
  {
    value: "views",
    label: "Saved views",
    items: [{ value: "triage", label: "Needs triage", href: "/views/triage", icon: "hash" }],
  },
];

/* the app routes itself: onNavigate stops the page load and the sidebar marks the link current */
export default function IssueTracker() {
  const [path, setPath] = useState("/projects/billing-api");
  const navigate = (_value: string, href: string, event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setPath(href);
  };
  return (
    <div className="flex h-[360px] w-[600px] max-w-full">
      <SidebarNav workspaces={workspaces} items={items} sections={sections} defaultCurrent="billing-api" onNavigate={navigate} />
      <main className="flex min-w-0 flex-1 flex-col gap-1 border-s border-line ps-6 pt-2">
        <h2 className="text-md font-medium text-ink">Issues</h2>
        <p className="text-sm text-ink-2" dir="ltr">{path}</p>
      </main>
    </div>
  );
}
