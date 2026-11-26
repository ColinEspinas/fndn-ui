<script setup lang="ts">
import { EntityChip } from "@fndn/vue";
</script>

<!-- a custom monogram when the first letter says nothing: a channel -->
<template>
  <p class="max-w-[300px] text-md text-ink">
    Failed deploys post to <EntityChip name="deploys" monogram="#" color="var(--fndn-tag-green)" /> and page <EntityChip name="Jonas Weber" color="var(--fndn-tag-blue)" /> after 10 minutes.
  </p>
</template>
