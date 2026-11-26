<script setup lang="ts">
import { ref } from "vue";
import { SidebarNav } from "@fndn/vue";

const workspaces = [{ value: "northwind", label: "Northwind" }];

const items = [
  { value: "inbox", label: "Inbox", href: "/inbox", icon: "bell", badge: "4" },
  { value: "my-issues", label: "My issues", href: "/my-issues", icon: "note-pencil" },
] as const;

/* every link has an icon, so the rail keeps one text edge */
const sections = [
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
] as const;

/* the app routes itself: navigate stops the page load and the sidebar marks the link current */
const current = ref("billing-api");
const path = ref("/projects/billing-api");
function navigate(_value: string, href: string, event: MouseEvent) {
  event.preventDefault();
  path.value = href;
}
</script>

<template>
  <div class="flex h-[360px] w-[600px] max-w-full">
    <SidebarNav :workspaces="workspaces" :items="items" :sections="sections" v-model:current="current" @navigate="navigate" />
    <main class="flex min-w-0 flex-1 flex-col gap-1 border-s border-line ps-6 pt-2">
      <h2 class="text-md font-medium text-ink">Issues</h2>
      <p class="text-sm text-ink-2" dir="ltr">{{ path }}</p>
    </main>
  </div>
</template>
