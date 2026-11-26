<script setup lang="ts">
import { ref } from "vue";
import { Field, InputGroup } from "@fndn/vue";

const subdomain = ref("feat-usage-alerts");
</script>

<!-- sm and subtle, as in a dense side panel; the addons keep the fixed parts of the URL out of the value -->
<template>
  <Field label="Preview URL" class="w-full max-w-72">
    <InputGroup v-model:value="subdomain" size="sm" variant="subtle" mono start="https://" end=".example.dev" />
  </Field>
</template>
