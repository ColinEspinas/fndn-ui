<script setup lang="ts">
import { ref } from "vue";
import { Textarea } from "@fndn/vue";

const payload = ref('{\n  "event": "deploy.failed",\n  "project": "billing-api",\n  "deploy": "dpl_7f3a9c",\n  "commit": "a1b2c3d"\n}');
</script>

<!-- autoResize off: a fixed height with a resize handle; mono for code -->
<template>
  <Textarea v-model:value="payload" :auto-resize="false" :rows="6" mono aria-label="Test payload" class="w-full max-w-80" />
</template>
