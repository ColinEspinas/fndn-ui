<script setup lang="ts">
import { Input, Label } from "@fndn/vue";
</script>

<!-- on its own, a label points at its control with for (inside a Field this is done for you) -->
<template>
  <div class="flex w-full max-w-80 flex-col gap-1.5">
    <Label for="signup-email">Email address</Label>
    <Input id="signup-email" type="email" autocomplete="email" placeholder="maya@northwind.example" />
  </div>
</template>
