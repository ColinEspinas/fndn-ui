<script lang="ts">
  import Gear from "phosphor-svelte/lib/GearIcon";
  import GitBranch from "phosphor-svelte/lib/GitBranchIcon";
  import Moon from "phosphor-svelte/lib/MoonIcon";
  import RocketLaunch from "phosphor-svelte/lib/RocketLaunchIcon";
  import UserPlus from "phosphor-svelte/lib/UserPlusIcon";
  import { Search, type SearchItem } from "@fndn/svelte";

  /* groups keep each kind of result together; a row can lead with an icon, end with the command's
   * shortcut, and be found by its keywords as well as its name */
  const items: SearchItem[] = [
    { value: "project:web-app", label: "web-app", group: "Projects", meta: "Production", icon: GitBranch },
    { value: "project:billing-api", label: "billing-api", group: "Projects", meta: "Staging", icon: GitBranch },
    { value: "deploy", label: "Deploy to Production", group: "Actions", shortcut: ["⌘", "D"], keywords: ["ship", "release"], icon: RocketLaunch },
    { value: "invite", label: "Invite teammates", group: "Actions", shortcut: ["⌘", "I"], icon: UserPlus },
    { value: "settings", label: "Workspace settings", group: "Settings", keywords: ["billing", "members"], icon: Gear },
    { value: "theme", label: "Switch to dark theme", group: "Settings", keywords: ["appearance", "night"], icon: Moon },
  ];
</script>

<Search class="w-80" {items} limit={6} label="Search Northwind" placeholder="Search projects and commands…" />
