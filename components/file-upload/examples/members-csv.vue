<script setup lang="ts">
import { FileUpload } from "@fndn/vue";
</script>

<!-- no label: the title names the drop zone; accept and maxFileSize reject the wrong file before it uploads -->
<template>
  <FileUpload
    class="w-full max-w-80"
    title="Import members from a CSV"
    hint="Drop it here or click to choose · up to 2 MB"
    :accept="['text/csv']"
    :max-file-size="2_000_000"
  />
</template>
