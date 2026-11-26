<script setup lang="ts">
import { Button, Field, Input, PasswordInput } from "@fndn/vue";
</script>

<template>
  <form class="flex w-full max-w-80 flex-col gap-4" @submit.prevent>
    <Field label="Work email">
      <Input type="email" autocomplete="email" placeholder="maya@northwind.example" />
    </Field>
    <Field label="Password">
      <PasswordInput auto-complete="current-password" />
    </Field>
    <Button type="submit" variant="primary">Sign in</Button>
  </form>
</template>
