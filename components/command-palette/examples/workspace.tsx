import { useState } from "react";
import { Gear, GitBranch, Lock, MagnifyingGlass, Moon, RocketLaunch, UserPlus } from "@phosphor-icons/react";
import { Button, CommandPalette, Kbd, type CommandPaletteItem } from "@fndn/react";

const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";

const commands: CommandPaletteItem[] = [
  { value: "/projects/web-app", label: "web-app", group: "Projects", meta: "Production", icon: <GitBranch data-slot="icon" weight="bold" /> },
  { value: "/projects/billing-api", label: "billing-api", group: "Projects", meta: "Staging", icon: <GitBranch data-slot="icon" weight="bold" /> },
  { value: "/projects/data-pipeline", label: "data-pipeline", group: "Projects", meta: "Preview", icon: <GitBranch data-slot="icon" weight="bold" /> },
  { value: "deploy", label: "Deploy web-app to Production", group: "Actions", shortcut: [mod, "D"], keywords: ["ship", "release"], icon: <RocketLaunch data-slot="icon" weight="bold" /> },
  { value: "invite", label: "Invite teammates", group: "Actions", shortcut: [mod, "I"], keywords: ["members", "add"], icon: <UserPlus data-slot="icon" weight="bold" /> },
  { value: "/settings/api-keys", label: "API keys", group: "Settings", keywords: ["token", "nw_live"], icon: <Lock data-slot="icon" weight="bold" /> },
  { value: "/settings", label: "Workspace settings", group: "Settings", keywords: ["billing", "plan"], icon: <Gear data-slot="icon" weight="bold" /> },
  { value: "theme", label: "Switch to dark theme", group: "Settings", keywords: ["appearance", "night"], icon: <Moon data-slot="icon" weight="bold" /> },
];

/* ⌘K / Ctrl K anywhere opens it; the button is the visible way in. Recent commands come first
 * while the query is empty: keep them yourself, most recent first */
export default function Workspace() {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState(["deploy", "/projects/billing-api"]);
  return (
    <span className="relative inline-flex w-60">
      <Button
        variant="outline" size="sm" className="w-full justify-start pe-14 text-ink-3"
        icon={<MagnifyingGlass data-slot="icon" weight="bold" />}
        aria-haspopup="dialog" aria-keyshortcuts={mod === "⌘" ? "Meta+K" : "Control+K"}
        onClick={() => setOpen(true)}
      >
        Search Northwind…
      </Button>
      <span className="pointer-events-none absolute inset-y-0 end-1.5 flex items-center" aria-hidden><Kbd keys={[mod, "K"]} /></span>
      <CommandPalette
        items={commands}
        recent={recent}
        open={open}
        onOpenChange={setOpen}
        placeholder="Search projects, settings and actions…"
        onSelect={(value) => setRecent((list) => [value, ...list.filter((v) => v !== value)].slice(0, 3))}
      />
    </span>
  );
}
