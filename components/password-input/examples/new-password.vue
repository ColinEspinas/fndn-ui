<script setup lang="ts">
import { computed, ref } from "vue";
import { Field, PasswordInput } from "@fndn/vue";

const password = ref("swordfish");
const short = computed(() => password.value.length > 0 && password.value.length < 12);
</script>

<!-- new-password: password managers offer to generate one; the error replaces the helper while too short -->
<template>
  <Field label="New password" helper="At least 12 characters." :error="`Too short: ${12 - password.length} more characters.`" :invalid="short" class="w-full max-w-80">
    <PasswordInput v-model:value="password" auto-complete="new-password" />
  </Field>
</template>
