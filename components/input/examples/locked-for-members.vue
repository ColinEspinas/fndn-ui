<script setup lang="ts">
import { Field, Input } from "@fndn/vue";
</script>

<!-- a disabled Field fades its label and control together; the helper says why -->
<template>
  <Field label="Workspace URL" helper="Only owners can change the workspace URL." disabled class="w-full max-w-80">
    <Input value="northwind" />
  </Field>
</template>
