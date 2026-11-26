<script setup lang="ts">
import { computed, ref } from "vue";
import { Menu, type MenuEntry } from "@fndn/vue";

const environments = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "preview", label: "Preview" },
];

/* a pick is the whole job, so the menu closes on it (closeOnSelect) */
const environment = ref("production");
const items = computed<MenuEntry[]>(() => [
  { type: "radio-group", name: "environment", label: "Show logs from", value: environment.value, closeOnSelect: true, items: environments },
]);
const current = computed(() => environments.find((e) => e.value === environment.value)?.label);
</script>

<template>
  <Menu :triggerLabel="current" :items="items" @radio-change="(_, value) => (environment = value)" />
</template>
