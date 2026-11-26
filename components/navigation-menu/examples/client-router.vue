<script setup lang="ts">
import { computed, ref } from "vue";
import { NavigationMenu, type NavigationMenuItem } from "@fndn/vue";

/* link-select hears every followed link: keep the current page in state and mark it */
const page = ref("#deploys");
const items = computed<NavigationMenuItem[]>(() => [
  { value: "overview", label: "Overview", href: "#overview", current: page.value === "#overview" },
  { value: "deploys", label: "Deploys", href: "#deploys", current: page.value === "#deploys" },
  {
    value: "observability",
    label: "Observability",
    links: [
      { label: "Logs", href: "#logs", current: page.value === "#logs" },
      { label: "Usage", href: "#usage", current: page.value === "#usage" },
    ],
  },
]);
</script>

<template>
  <NavigationMenu label="billing-api" :items="items" @link-select="(href) => (page = href)" />
</template>
