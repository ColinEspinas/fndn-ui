<script setup lang="ts">
import { computed, ref } from "vue";
import { Field, Input } from "@fndn/vue";

const email = ref("daniel@northwind");
const invalid = computed(() => email.value !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value));
</script>

<!-- invalid: the control's ring turns red and the error takes the helper's place -->
<template>
  <Field
    label="Invite by email"
    helper="They get a link to join Northwind."
    error="Add the domain, like daniel@northwind.example."
    :invalid="invalid"
    class="w-full max-w-80"
  >
    <Input v-model:value="email" type="email" />
  </Field>
</template>
