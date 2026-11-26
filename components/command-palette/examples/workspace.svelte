<script lang="ts">
  import Gear from "phosphor-svelte/lib/GearIcon";
  import GitBranch from "phosphor-svelte/lib/GitBranchIcon";
  import Lock from "phosphor-svelte/lib/LockIcon";
  import MagnifyingGlass from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import Moon from "phosphor-svelte/lib/MoonIcon";
  import RocketLaunch from "phosphor-svelte/lib/RocketLaunchIcon";
  import UserPlus from "phosphor-svelte/lib/UserPlusIcon";
  import { Button, CommandPalette, Kbd, type CommandPaletteItem } from "@fndn/svelte";

  const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";

  const commands: CommandPaletteItem[] = [
    { value: "/projects/web-app", label: "web-app", group: "Projects", meta: "Production", icon: GitBranch },
    { value: "/projects/billing-api", label: "billing-api", group: "Projects", meta: "Staging", icon: GitBranch },
    { value: "/projects/data-pipeline", label: "data-pipeline", group: "Projects", meta: "Preview", icon: GitBranch },
    { value: "deploy", label: "Deploy web-app to Production", group: "Actions", shortcut: [mod, "D"], keywords: ["ship", "release"], icon: RocketLaunch },
    { value: "invite", label: "Invite teammates", group: "Actions", shortcut: [mod, "I"], keywords: ["members", "add"], icon: UserPlus },
    { value: "/settings/api-keys", label: "API keys", group: "Settings", keywords: ["token", "nw_live"], icon: Lock },
    { value: "/settings", label: "Workspace settings", group: "Settings", keywords: ["billing", "plan"], icon: Gear },
    { value: "theme", label: "Switch to dark theme", group: "Settings", keywords: ["appearance", "night"], icon: Moon },
  ];

  let open = $state(false);
  let recent = $state(["deploy", "/projects/billing-api"]);
</script>

<!-- ⌘K / Ctrl K anywhere opens it; the button is the visible way in. Recent commands come first
     while the query is empty: keep them yourself, most recent first -->
<span class="relative inline-flex w-60">
  <Button
    variant="outline" size="sm" class="w-full justify-start pe-14 text-ink-3"
    aria-haspopup="dialog" aria-keyshortcuts={mod === "⌘" ? "Meta+K" : "Control+K"}
    onclick={() => (open = true)}
  >
    {#snippet icon()}<MagnifyingGlass data-slot="icon" weight="bold" />{/snippet}
    Search Northwind…
  </Button>
  <span class="pointer-events-none absolute inset-y-0 end-1.5 flex items-center" aria-hidden="true"><Kbd keys={[mod, "K"]} /></span>
  <CommandPalette
    bind:open
    items={commands}
    {recent}
    placeholder="Search projects, settings and actions…"
    onselect={(value) => (recent = [value, ...recent.filter((v) => v !== value)].slice(0, 3))}
  />
</span>
