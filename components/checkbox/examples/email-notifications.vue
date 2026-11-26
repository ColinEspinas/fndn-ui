<script setup lang="ts">
import { ref } from "vue";
import { Checkbox } from "@fndn/vue";

/* independent options under one heading: a fieldset and its legend name the group */
const deployFailed = ref(true);
const reviewRequested = ref(true);
const usage = ref(false);
</script>

<template>
  <fieldset class="flex w-80 flex-col gap-2.5">
    <legend class="mb-3 text-sm font-medium text-ink">Email me when</legend>
    <Checkbox v-model:checked="deployFailed" name="email" value="deploy-failed" label="A deploy to Production fails" />
    <Checkbox v-model:checked="reviewRequested" name="email" value="review-requested" label="Someone requests my review" />
    <Checkbox v-model:checked="usage" name="email" value="usage" label="Usage passes 80% of the Team plan" />
  </fieldset>
</template>
