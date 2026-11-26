<script setup lang="ts">
import { ref } from "vue";
import { Switch } from "@fndn/vue";

/* no visible label in a row: the switch is named by `label` (its aria-label) */
const environments = ref([
  { name: "Production", protected: true },
  { name: "Staging", protected: true },
  { name: "Preview", protected: false },
]);
</script>

<template>
  <table class="w-80 text-sm">
    <thead>
      <tr class="text-start text-xs text-ink-2">
        <th class="pb-2 text-start font-medium">Environment</th>
        <th class="pb-2 text-end font-medium">Password</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="env in environments" :key="env.name">
        <td class="py-1.5 text-ink">{{ env.name }}</td>
        <td class="py-1.5 text-end">
          <Switch v-model:checked="env.protected" size="sm" :label="`Password-protect ${env.name}`" />
        </td>
      </tr>
    </tbody>
  </table>
</template>
