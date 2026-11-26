<script setup lang="ts">
import { ref } from "vue";
import { Field, PasswordInput } from "@fndn/vue";

const password = ref("tidal-ledger-9-orbit");
</script>

<!-- the eye button shows the password while you check it; current-password lets managers fill it -->
<template>
  <Field label="Password" class="w-full max-w-80">
    <PasswordInput v-model:value="password" auto-complete="current-password" />
  </Field>
</template>
