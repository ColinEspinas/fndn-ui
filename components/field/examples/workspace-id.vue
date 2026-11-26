<script setup lang="ts">
import { Field, Input } from "@fndn/vue";
</script>

<!-- read-only: the value can be selected and copied, not changed (unlike disabled, it stays in the tab order) -->
<template>
  <Field label="Workspace ID" helper="Support may ask for it." read-only class="w-full max-w-80">
    <Input mono value="ws_8f2k1m9q4t" />
  </Field>
</template>
