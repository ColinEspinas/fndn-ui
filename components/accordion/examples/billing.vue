<script setup lang="ts">
import { ref } from "vue";
import { Accordion, Button } from "@fndn/vue";

/* free content after an item's detail: the actions of that section */
const open = ref(["plan"]);
const items = [
  { value: "plan", label: "Plan", meta: "Team", detail: "12 of 20 seats in use. Renews on Dec 1, 2026 at $240.00." },
  { value: "payment", label: "Payment method", meta: "Card ending 4242", detail: "Expires 08/2028. Receipts go to maya@northwind.example." },
];
</script>

<template>
  <Accordion variant="card" v-model:value="open" style="width: 360px" :items="items">
    <template #content="{ item }">
      <div v-if="item.value === 'plan'" class="flex gap-2 px-2.5 pb-2.5">
        <Button size="sm">Change plan</Button>
        <Button size="sm" variant="ghost">View invoices</Button>
      </div>
      <div v-else class="flex gap-2 px-2.5 pb-2.5">
        <Button size="sm">Update card</Button>
      </div>
    </template>
  </Accordion>
</template>
