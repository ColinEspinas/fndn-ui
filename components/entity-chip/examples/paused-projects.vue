<script setup lang="ts">
import { EntityChip } from "@fndn/vue";
</script>

<!-- one colour per project, the same everywhere it is named -->
<template>
  <p class="max-w-[300px] text-md text-ink">
    Deploys are paused on <EntityChip name="billing-api" color="var(--fndn-tag-purple)" /> and <EntityChip name="data-pipeline" color="var(--fndn-tag-cyan)" /> until the incident is resolved.
  </p>
</template>
