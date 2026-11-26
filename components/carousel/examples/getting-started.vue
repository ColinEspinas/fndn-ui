<script setup lang="ts">
import { ref } from "vue";
import { Button, Carousel } from "@fndn/vue";

const steps = [
  "Connect the northwind/web-app repository",
  "Pick the branch that deploys to Production",
  "Add the environment variables from your .env file",
  "Deploy, and get a URL for every pull request",
];
const page = ref(0);
</script>

<template>
  <div class="flex w-full max-w-sm flex-col items-start gap-2">
    <Carousel v-model:page="page" label="Getting started" :items="steps" />
    <Button size="sm" variant="ghost" :disabled="page === steps.length - 1" @click="page = steps.length - 1">Skip to deploy</Button>
  </div>
</template>
