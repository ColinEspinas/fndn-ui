<script setup lang="ts">
import { Message } from "@fndn/vue";
</script>

<template>
  <div class="flex w-80 flex-col gap-3">
    <Message role="user" text="Why did the last deploy of billing-api fail?" />
    <Message
      role="assistant" name="Assistant" avatar time="2 min ago" :actions="['copy', 'retry', 'good', 'bad']"
      text="DATABASE_URL is missing from Production. Add it in Settings → Environment variables, then redeploy."
    />
  </div>
</template>
