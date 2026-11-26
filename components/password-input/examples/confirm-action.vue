<script setup lang="ts">
import { ref } from "vue";
import { PhLock } from "@phosphor-icons/vue";
import { Field, PasswordInput } from "@fndn/vue";

const password = ref("");
</script>

<!-- asked again before a sensitive change; the lock marks the field as a confirmation -->
<template>
  <Field label="Confirm with your password" helper="Required to rotate the production API key." class="w-full max-w-80">
    <PasswordInput v-model:value="password" auto-complete="current-password">
      <template #start><PhLock weight="bold" aria-hidden="true" /></template>
    </PasswordInput>
  </Field>
</template>
