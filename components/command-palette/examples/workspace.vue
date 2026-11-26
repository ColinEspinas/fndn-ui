<script setup lang="ts">
import { ref } from "vue";
import { PhGear, PhGitBranch, PhLock, PhMagnifyingGlass, PhMoon, PhRocketLaunch, PhUserPlus } from "@phosphor-icons/vue";
import { Button, CommandPalette, Kbd, type CommandPaletteItem } from "@fndn/vue";

const mod = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl";

const commands: CommandPaletteItem[] = [
  { value: "/projects/web-app", label: "web-app", group: "Projects", meta: "Production", icon: PhGitBranch },
  { value: "/projects/billing-api", label: "billing-api", group: "Projects", meta: "Staging", icon: PhGitBranch },
  { value: "/projects/data-pipeline", label: "data-pipeline", group: "Projects", meta: "Preview", icon: PhGitBranch },
  { value: "deploy", label: "Deploy web-app to Production", group: "Actions", shortcut: [mod, "D"], keywords: ["ship", "release"], icon: PhRocketLaunch },
  { value: "invite", label: "Invite teammates", group: "Actions", shortcut: [mod, "I"], keywords: ["members", "add"], icon: PhUserPlus },
  { value: "/settings/api-keys", label: "API keys", group: "Settings", keywords: ["token", "nw_live"], icon: PhLock },
  { value: "/settings", label: "Workspace settings", group: "Settings", keywords: ["billing", "plan"], icon: PhGear },
  { value: "theme", label: "Switch to dark theme", group: "Settings", keywords: ["appearance", "night"], icon: PhMoon },
];

const open = ref(false);
const recent = ref(["deploy", "/projects/billing-api"]);
function remember(value: string) {
  recent.value = [value, ...recent.value.filter((v) => v !== value)].slice(0, 3);
}
</script>

<!-- ⌘K / Ctrl K anywhere opens it; the button is the visible way in. Recent commands come first
     while the query is empty: keep them yourself, most recent first -->
<template>
  <span class="relative inline-flex w-60">
    <Button
      variant="outline" size="sm" class="w-full justify-start pe-14 text-ink-3"
      aria-haspopup="dialog" :aria-keyshortcuts="mod === '⌘' ? 'Meta+K' : 'Control+K'"
      @click="open = true"
    >
      <template #icon><PhMagnifyingGlass data-slot="icon" weight="bold" /></template>
      Search Northwind…
    </Button>
    <span class="pointer-events-none absolute inset-y-0 end-1.5 flex items-center" aria-hidden="true"><Kbd :keys="[mod, 'K']" /></span>
    <CommandPalette
      v-model:open="open"
      :items="commands"
      :recent="recent"
      placeholder="Search projects, settings and actions…"
      @select="remember"
    />
  </span>
</template>
