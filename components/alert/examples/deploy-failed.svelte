<script lang="ts">
  import { Alert, type AlertAction } from "@fndn/svelte";

  const actions: AlertAction[] = [
    { label: "Redeploy", value: "redeploy" },
    { label: "Dismiss", value: "dismiss", variant: "ghost" },
  ];
  let state = $state<"failed" | "redeploying" | "dismissed">("failed");
</script>

{#if state === "redeploying"}
  <Alert class="w-full max-w-[420px]" tone="accent" title="Redeploying web-app">
    Started again from commit a1b2c3d on main.
  </Alert>
{:else if state === "failed"}
  <Alert
    class="w-full max-w-[420px]"
    tone="red"
    title="Deploy to Production failed"
    {actions}
    onaction={(value) => (state = value === "redeploy" ? "redeploying" : "dismissed")}
  >
    The build of dpl_7f3a9c exited with code 1. The previous deploy is still live.
  </Alert>
{/if}
