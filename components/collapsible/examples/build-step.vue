<script setup lang="ts">
import { ref } from "vue";
import { Collapsible } from "@fndn/vue";

const open = ref(true);
</script>

<template>
  <Collapsible
    variant="row"
    v-model:open="open"
    label="Build"
    meta="48s"
    detail="Installed 1,284 packages, compiled 312 modules and uploaded 14.2 MB of assets for dpl_7f3a9c."
    style="width: 320px"
  />
</template>
