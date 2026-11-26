<script setup lang="ts">
import { FileUpload } from "@fndn/vue";
</script>

<template>
  <FileUpload
    class="w-full max-w-sm"
    label="Screenshots"
    title="Drop screenshots here"
    hint="PNG or JPG, up to 4 files of 5 MB"
    :accept="['image/png', 'image/jpeg']"
    :max-files="4"
    :max-file-size="5_000_000"
  />
</template>
