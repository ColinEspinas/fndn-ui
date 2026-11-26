<script setup lang="ts">
import { ref } from "vue";
import { Editable } from "@fndn/vue";

const name = ref("billing-api");
</script>

<!-- reads as text until focused or clicked; Enter saves, Escape puts the old name back -->
<template>
  <Editable v-model:value="name" label="Project name" style="width: 260px" />
</template>
