<script setup lang="ts">
import { ApprovalCard, Message, type ApprovalAction } from "@fndn/vue";

const action: ApprovalAction = {
  title: "Run the tests in billing-api?",
  command: "pnpm --filter billing-api test",
  details: [{ label: "Branch", value: "fix/rate-limit", mono: true }],
};
</script>

<!-- the agent stops to ask: an approval card inside its message -->
<template>
  <div class="w-80">
    <Message role="assistant" name="Assistant" avatar>
      <div class="flex flex-col gap-2">
        <p class="text-sm leading-[1.5]">I reset the window once a minute has passed. Shall I check it?</p>
        <ApprovalCard :action="action" always-allow />
      </div>
    </Message>
  </div>
</template>
