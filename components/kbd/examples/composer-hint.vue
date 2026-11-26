<script setup lang="ts">
import { Kbd } from "@fndn/vue";
</script>

<!-- plain: no box, for a quiet hint line under a field -->
<template>
  <p class="flex items-center gap-1.5 text-xs text-ink-2">
    <Kbd variant="plain" :keys="['↵']" /> to comment
    <span aria-hidden="true">·</span>
    <Kbd variant="plain" :keys="['⇧', '↵']" /> for a new line
  </p>
</template>
