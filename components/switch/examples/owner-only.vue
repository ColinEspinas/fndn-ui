<script setup lang="ts">
import { Switch } from "@fndn/vue";
</script>

<!-- disabled keeps its state readable and says who can change it -->
<template>
  <div class="flex max-w-80 flex-col gap-2">
    <Switch checked disabled aria-describedby="two-factor-help">Require two-factor authentication</Switch>
    <p id="two-factor-help" class="text-sm text-ink-2">Only Maya Chen, the workspace owner, can change this.</p>
  </div>
</template>
