<script setup lang="ts">
import { ref } from "vue";
import { Tag } from "@fndn/vue";

const files = ref(["deploy-log.txt", "checkout-error.png"]);
</script>

<!-- pill tags in a pill-shaped host (a comment box), with a tooltip on the remove button -->
<template>
  <div class="flex flex-wrap gap-1.5">
    <Tag v-for="file in files" :key="file" shape="pill" removable :removeLabel="`Remove ${file}`" removeTooltip="Remove" @remove="files = files.filter((f) => f !== file)">
      {{ file }}
    </Tag>
  </div>
</template>
