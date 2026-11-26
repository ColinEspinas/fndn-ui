<script setup lang="ts">
import { Count } from "@fndn/vue";
</script>

<!-- plain: the count in the heading's own size, quieter -->
<template>
  <div class="flex w-72 flex-col gap-1">
    <h3 class="flex items-baseline gap-2 text-md font-medium text-ink">
      Members <Count>1,284</Count>
    </h3>
    <p class="text-sm text-ink-2">Everyone in Northwind, including 3 pending invites.</p>
  </div>
</template>
