<script setup lang="ts">
import { PhCheckCircle } from "@phosphor-icons/vue";
import { Button } from "@fndn/vue";
</script>

<!-- success: the green fill for the one action whose colour says "this is safe to go", once every check has passed; the line above it says why -->
<template>
  <div class="flex max-w-96 flex-col items-start gap-3">
    <div>
      <p class="flex items-center gap-1.5 text-sm font-medium text-ink">
        <PhCheckCircle data-slot="icon" weight="fill" class="shrink-0 text-green" aria-hidden="true" />
        All checks have passed
      </p>
      <p class="text-sm text-ink-2">4 successful checks · Approved by Priya Raman. Merges #482 into main.</p>
    </div>
    <Button variant="success">Merge pull request</Button>
  </div>
</template>
