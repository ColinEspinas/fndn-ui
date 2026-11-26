<script setup lang="ts">
import { ref } from "vue";
import { TagsInput } from "@fndn/vue";

const reviewers = ref(["Priya Raman", "Daniel Okafor"]);
</script>

<!-- max: the input stops taking tags at three -->
<template>
  <TagsInput v-model:value="reviewers" label="Required reviewers, up to 3" :max="3" placeholder="Add a reviewer" style="width: 320px" />
</template>
