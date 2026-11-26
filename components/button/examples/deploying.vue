<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { PhRocketLaunch } from "@phosphor-icons/vue";
import { Button } from "@fndn/vue";

/* busy: the spinner takes the icon's place, the button keeps its width and its focus, and a second
 * press does nothing; the status beside it says what is running */
const busy = ref(false);
let timer = 0;
onBeforeUnmount(() => clearTimeout(timer));
function deploy() {
  busy.value = true;
  timer = window.setTimeout(() => (busy.value = false), 2500);
}
</script>

<template>
  <div class="flex items-center gap-3">
    <Button variant="primary" :busy="busy" @click="deploy">
      <template #icon><PhRocketLaunch data-slot="icon" weight="bold" /></template>
      Deploy to Production
    </Button>
    <span class="text-sm text-ink-2" role="status">{{ busy ? "Deploying a1b2c3d…" : "" }}</span>
  </div>
</template>
