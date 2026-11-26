import { Gear, GitBranch, Moon, RocketLaunch, UserPlus } from "@phosphor-icons/react";
import { Search, type SearchItem } from "@fndn/react";

/* groups keep each kind of result together; a row can lead with an icon, end with the command's
 * shortcut, and be found by its keywords as well as its name */
const items: SearchItem[] = [
  { value: "project:web-app", label: "web-app", group: "Projects", meta: "Production", icon: <GitBranch data-slot="icon" weight="bold" /> },
  { value: "project:billing-api", label: "billing-api", group: "Projects", meta: "Staging", icon: <GitBranch data-slot="icon" weight="bold" /> },
  { value: "deploy", label: "Deploy to Production", group: "Actions", shortcut: ["⌘", "D"], keywords: ["ship", "release"], icon: <RocketLaunch data-slot="icon" weight="bold" /> },
  { value: "invite", label: "Invite teammates", group: "Actions", shortcut: ["⌘", "I"], icon: <UserPlus data-slot="icon" weight="bold" /> },
  { value: "settings", label: "Workspace settings", group: "Settings", keywords: ["billing", "members"], icon: <Gear data-slot="icon" weight="bold" /> },
  { value: "theme", label: "Switch to dark theme", group: "Settings", keywords: ["appearance", "night"], icon: <Moon data-slot="icon" weight="bold" /> },
];

export default function GroupedCommands() {
  return <Search className="w-80" items={items} limit={6} label="Search Northwind" placeholder="Search projects and commands…" />;
}
