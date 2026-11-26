<script setup lang="ts">
import { PhDotsThree, PhLinkSimple, PhPencilSimple } from "@phosphor-icons/vue";
import { Button, Tooltip } from "@fndn/vue";

/* icon-only buttons: ghost and muted, square, each named by aria-label and its tooltip */
const actions = [
  { label: "Edit title", Icon: PhPencilSimple },
  { label: "Copy link", Icon: PhLinkSimple },
  { label: "More actions", Icon: PhDotsThree },
];
</script>

<template>
  <div class="flex w-80 items-center justify-between gap-3">
    <p class="min-w-0 text-sm text-ink">#482 Add retry to webhook delivery</p>
    <div role="toolbar" aria-label="Pull request actions" class="flex shrink-0 gap-0.5">
      <Tooltip v-for="{ label, Icon } in actions" :key="label" :content="label">
        <Button variant="ghost" size="sm" square muted :aria-label="label">
          <template #icon><component :is="Icon" data-slot="icon" weight="bold" /></template>
        </Button>
      </Tooltip>
    </div>
  </div>
</template>
