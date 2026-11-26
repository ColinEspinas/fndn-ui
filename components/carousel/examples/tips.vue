<script setup lang="ts">
import { Carousel } from "@fndn/vue";

const tips = [
  "Press ⌘K to search projects, people and deploys.",
  "Type # in a comment to link a pull request.",
  "Hold Shift with an arrow key to resize a panel by 10%.",
];
</script>

<template>
  <Carousel class="w-full max-w-sm" label="Tips" loop="rewind" :items="tips" />
</template>
