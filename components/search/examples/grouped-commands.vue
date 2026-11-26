<script setup lang="ts">
import { PhGear, PhGitBranch, PhMoon, PhRocketLaunch, PhUserPlus } from "@phosphor-icons/vue";
import { Search, type SearchItem } from "@fndn/vue";

/* groups keep each kind of result together; a row can lead with an icon, end with the command's
 * shortcut, and be found by its keywords as well as its name */
const items: SearchItem[] = [
  { value: "project:web-app", label: "web-app", group: "Projects", meta: "Production", icon: PhGitBranch },
  { value: "project:billing-api", label: "billing-api", group: "Projects", meta: "Staging", icon: PhGitBranch },
  { value: "deploy", label: "Deploy to Production", group: "Actions", shortcut: ["⌘", "D"], keywords: ["ship", "release"], icon: PhRocketLaunch },
  { value: "invite", label: "Invite teammates", group: "Actions", shortcut: ["⌘", "I"], icon: PhUserPlus },
  { value: "settings", label: "Workspace settings", group: "Settings", keywords: ["billing", "members"], icon: PhGear },
  { value: "theme", label: "Switch to dark theme", group: "Settings", keywords: ["appearance", "night"], icon: PhMoon },
];
</script>

<template>
  <Search class="w-80" :items="items" :limit="6" label="Search Northwind" placeholder="Search projects and commands…" />
</template>
