<script setup lang="ts">
import { ref } from "vue";
import { Checkbox } from "@fndn/vue";

/* md (18px) in table rows; no visible label, so each box is named after its row */
const projects = [
  { name: "web-app", deployed: "2 min ago" },
  { name: "billing-api", deployed: "Nov 14, 2026" },
  { name: "data-pipeline", deployed: "Nov 9, 2026" },
];

const selected = ref<string[]>(["billing-api"]);
</script>

<template>
  <div class="flex w-80 flex-col gap-2">
    <p class="text-xs text-ink-2" role="status">{{ selected.length }} of {{ projects.length }} projects selected</p>
    <table class="w-full text-sm">
      <tbody>
        <tr v-for="p in projects" :key="p.name">
          <td class="w-8 py-1.5">
            <Checkbox
              size="md"
              :aria-label="`Select ${p.name}`"
              :checked="selected.includes(p.name)"
              @update:checked="(v) => (selected = v === true ? [...selected, p.name] : selected.filter((s) => s !== p.name))"
            />
          </td>
          <td class="py-1.5 text-ink">{{ p.name }}</td>
          <td class="py-1.5 text-end text-ink-2">{{ p.deployed }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
