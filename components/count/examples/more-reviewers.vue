<script setup lang="ts">
import { Avatar, Count } from "@fndn/vue";

const reviewers = [
  { name: "Maya Chen", color: "var(--fndn-tag-orange)" },
  { name: "Daniel Okafor", color: "var(--fndn-tag-blue)" },
];
</script>

<!-- the reviewers who do not fit are a count -->
<template>
  <div class="flex items-center gap-2 text-sm text-ink-2">
    Reviewers
    <Avatar v-for="r in reviewers" :key="r.name" :name="r.name" :color="r.color" size="20" />
    <Count variant="boxed" size="sm" aria-label="3 more reviewers">+3</Count>
  </div>
</template>
