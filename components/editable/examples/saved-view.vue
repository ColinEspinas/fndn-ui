<script setup lang="ts">
import { ref } from "vue";
import { Editable } from "@fndn/vue";

const name = ref("Failed deploys this week");
</script>

<!-- sm: a saved view's name in a sidebar, renamed where it is -->
<template>
  <Editable v-model:value="name" size="sm" aria-label="View name" style="width: 220px" />
</template>
