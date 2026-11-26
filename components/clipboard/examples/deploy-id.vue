<script setup lang="ts">
import { Clipboard } from "@fndn/vue";
</script>

<!-- labels name what is copied; Copy and Copied keep one width -->
<template>
  <div class="flex items-center gap-2 text-sm">
    <span class="text-ink-2">Deploy</span>
    <code class="font-mono text-xs text-ink">dpl_7f3a9c</code>
    <Clipboard value="dpl_7f3a9c" :labels="{ copy: 'Copy ID', copied: 'ID copied' }" />
  </div>
</template>
