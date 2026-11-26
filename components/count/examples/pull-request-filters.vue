<script setup lang="ts">
import { ref } from "vue";
import { Button, Count } from "@fndn/vue";

const filters = [
  { value: "open", label: "Open", count: "28" },
  { value: "merged", label: "Merged", count: "1,204" },
  { value: "closed", label: "Closed", count: "96" },
];
const filter = ref("open");
</script>

<!-- inside a pressed control the count takes the selected look by itself -->
<template>
  <div class="flex gap-1">
    <Button v-for="f in filters" :key="f.value" size="sm" :variant="filter === f.value ? 'outline' : 'ghost'" :aria-pressed="filter === f.value" @click="filter = f.value">
      {{ f.label }} <Count variant="boxed">{{ f.count }}</Count>
    </Button>
  </div>
</template>
