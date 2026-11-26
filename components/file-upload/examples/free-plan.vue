<script setup lang="ts">
import { FileUpload } from "@fndn/vue";
</script>

<!-- disabled: the hint says what unlocks it -->
<template>
  <FileUpload
    class="w-full max-w-80"
    label="Build artifacts"
    title="Uploads are off on Free"
    hint="Upgrade to Team to keep build artifacts"
    disabled
  />
</template>
