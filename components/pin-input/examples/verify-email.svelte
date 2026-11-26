<script lang="ts">
  import { PinInput } from "@fndn/svelte";

  let status = $state<"idle" | "wrong" | "ok">("idle");
</script>

<!-- checked when the last digit is in; the message under it is a live region -->
<div class="flex flex-col gap-2">
  <PinInput
    label="Verification code"
    otp
    invalid={status === "wrong"}
    onvaluechange={() => (status = "idle")}
    onvaluecomplete={(code) => (status = code === "123456" ? "ok" : "wrong")}
  />
  <p class="m-0 text-xs text-ink-2" role="status">
    {status === "wrong" ? "That code is wrong or has expired." : status === "ok" ? "Email verified." : "Sent to maya@northwind.example."}
  </p>
</div>
