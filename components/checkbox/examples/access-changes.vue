<script setup lang="ts">
import { ref } from "vue";
import { Checkbox } from "@fndn/vue";

/* tone: green for a change that adds, red for one that removes; the label says which */
const add = ref(true);
const remove = ref(true);
</script>

<template>
  <fieldset class="flex w-80 flex-col gap-2.5">
    <legend class="mb-3 text-sm font-medium text-ink">Apply 2 access changes</legend>
    <Checkbox v-model:checked="add" tone="green" label="Add Priya Raman to billing-api as maintainer" />
    <Checkbox v-model:checked="remove" tone="red" label="Remove Lucas Moreau from mobile" />
  </fieldset>
</template>
