<script setup lang="ts">
import { ref } from "vue";
import { Field, Textarea } from "@fndn/vue";

const reason = ref("");
</script>

<template>
  <Field label="Why are you cancelling?" helper="Optional. Read by the billing team, never shared." class="w-full max-w-80">
    <Textarea v-model:value="reason" placeholder="Missing a feature, too expensive, moving to another tool…" />
  </Field>
</template>
