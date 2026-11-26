import type { ComponentProps } from "react";
import { SidebarNav } from "@fndn/react";

type Props = ComponentProps<typeof SidebarNav>;

const workspaces: Props["workspaces"] = [
  { value: "harbor", label: "Harbor" },
  { value: "harbor-eu", label: "Harbor EU" },
  { value: "sandbox", label: "Maya's sandbox" },
];

const items: Props["items"] = [
  { value: "new", label: "New chat", href: "#new", icon: "note-pencil" },
  { value: "home", label: "Home", href: "#home", icon: "house" },
  {
    value: "invite",
    label: "Invite teammates",
    href: "#invite",
    icon: "user-plus",
    badge: "3/10",
  },
];

/* the rail against the app it belongs to: the content pane starts at its hairline */
export default function FirstDayInWorkspace() {
  return (
    <div className="flex h-[360px] w-[600px] max-w-full">
      <SidebarNav
        defaultWorkspace="harbor"
        workspaces={workspaces}
        logo="calendar"
        items={items}
        chats={[]}
        defaultCurrent="home"
      />
      <main className="flex min-w-0 flex-1 flex-col gap-1 border-s border-line ps-6 pt-2">
        <h2 className="text-md font-medium text-ink">Welcome to Harbor</h2>
        <p className="text-sm text-ink-2">Your chats will be listed in the sidebar once you start one.</p>
      </main>
    </div>
  );
}
