<script setup lang="ts">
import { ref } from "vue";
import { Field, Textarea } from "@fndn/vue";

const description = ref("");
</script>

<template>
  <Field label="Description" helper="Shown on the project's overview page." class="w-full max-w-80">
    <Textarea v-model:value="description" placeholder="What this project does and who owns it" />
  </Field>
</template>
