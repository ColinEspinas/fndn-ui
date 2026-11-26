<script setup lang="ts">
import { ref } from "vue";
import { PhPlus } from "@phosphor-icons/vue";
import { Button, Tabs, type TabsItem } from "@fndn/vue";

const items: TabsItem[] = [
  { value: "variables", label: "Variables", content: "12 variables: 8 in every environment, 4 in Production only." },
  { value: "domains", label: "Domains", content: "app.northwind.example and 2 preview domains." },
];

const value = ref("variables");
</script>

<!-- the end slot sits at the far end of the tab row: the action for the section -->
<template>
  <Tabs v-model:value="value" class="w-80" :items="items" aria-label="Environment">
    <template #end>
      <Button size="sm" variant="ghost" class="ms-auto">
        <template #icon><PhPlus data-slot="icon" weight="bold" /></template>
        Add
      </Button>
    </template>
  </Tabs>
</template>
