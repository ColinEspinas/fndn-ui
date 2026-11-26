<script setup lang="ts">
import { ref } from "vue";
import { Collapsible } from "@fndn/vue";

const projects = ["web-app", "billing-api", "mobile", "data-pipeline"];
const open = ref(true);
</script>

<!-- section: a quiet header with the caret first, over a group of links -->
<template>
  <Collapsible variant="section" caret="start" v-model:open="open" label="Projects" style="width: 240px">
    <ul class="flex flex-col px-2.5 pb-1 text-sm">
      <li v-for="project in projects" :key="project">
        <a :href="`#${project}`" class="block rounded-chip py-1 text-ink-2 hover:text-ink">{{ project }}</a>
      </li>
    </ul>
  </Collapsible>
</template>
