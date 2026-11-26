<script lang="ts">
  import Bell from "phosphor-svelte/lib/BellIcon";
  import DeviceMobile from "phosphor-svelte/lib/DeviceMobileIcon";
  import EnvelopeSimple from "phosphor-svelte/lib/EnvelopeSimpleIcon";
  import { ToggleGroup } from "@fndn/svelte";

  /* several channels at once; one the plan does not include is disabled and says why */
  const channels = [
    { value: "email", label: "Email", icon: EnvelopeSimple },
    { value: "in-app", label: "In app", icon: Bell },
    { value: "sms", label: "SMS", icon: DeviceMobile, tooltip: "SMS alerts need the Business plan", disabled: true },
  ];

  let notify = $state<string[]>(["email", "in-app"]);
</script>

<div class="flex flex-col items-start gap-2">
  <p class="text-sm font-medium text-ink">When a deploy fails, notify me by</p>
  <ToggleGroup bind:value={notify} aria-label="When a deploy fails, notify me by" multiple size="sm" items={channels} />
</div>
