<script setup lang="ts">
import { ref } from "vue";
import { PinInput } from "@fndn/vue";

const status = ref<"idle" | "wrong" | "ok">("idle");
</script>

<!-- checked when the last digit is in; the message under it is a live region -->
<template>
  <div class="flex flex-col gap-2">
    <PinInput
      label="Verification code"
      otp
      :invalid="status === 'wrong'"
      @value-change="status = 'idle'"
      @value-complete="(code) => (status = code === '123456' ? 'ok' : 'wrong')"
    />
    <p class="m-0 text-xs text-ink-2" role="status">
      {{ status === "wrong" ? "That code is wrong or has expired." : status === "ok" ? "Email verified." : "Sent to maya@northwind.example." }}
    </p>
  </div>
</template>
