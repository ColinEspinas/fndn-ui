<script setup lang="ts">
import { ref } from "vue";
import { Field, Input } from "@fndn/vue";

const name = ref("billing-api");
</script>

<!-- an Input almost always sits in a Field: the label and the helper are wired to it -->
<template>
  <Field label="Project name" helper="Used in URLs and the CLI: lowercase and dashes." class="w-full max-w-80">
    <Input v-model:value="name" autocomplete="off" />
  </Field>
</template>
