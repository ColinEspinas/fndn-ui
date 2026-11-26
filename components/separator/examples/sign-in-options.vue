<script setup lang="ts">
import { Button, Separator } from "@fndn/vue";
</script>

<template>
  <div class="flex w-72 flex-col gap-3">
    <Button variant="primary">Continue with email</Button>
    <Separator>or</Separator>
    <Button>Continue with single sign-on</Button>
  </div>
</template>
