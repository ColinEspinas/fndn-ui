<script lang="ts">
  import { Drawer, Select, Switch, type DrawerAction } from "@fndn/svelte";

  const allEnvironments = "All environments";
  const anyStatus = "Any status";
  const environments = [allEnvironments, "Production", "Staging", "Preview"];
  const statuses = [anyStatus, "Ready", "Building", "Failed"];

  const actions: DrawerAction[] = [
    { label: "Reset", value: "reset", variant: "ghost", close: false },
    { label: "Show 24 deploys", value: "apply", variant: "primary" },
  ];

  /* on a phone, filters come up from the bottom; Reset keeps the sheet open */
  let environment = $state("Production");
  let status = $state(anyStatus);
  let mine = $state(false);
  function reset(value: string) {
    if (value !== "reset") return;
    environment = allEnvironments;
    status = anyStatus;
    mine = false;
  }
</script>

<div class="flex w-80 items-center justify-between gap-3">
  <div class="flex min-w-0 flex-col">
    <span class="text-sm font-medium text-ink">Deploys</span>
    <span class="text-xs text-ink-2">Production · last 7 days</span>
  </div>
  <Drawer side="bottom" triggerLabel="Filters" title="Filter deploys" {actions} onaction={reset}>
    <div class="flex flex-col gap-4">
      <Select bind:value={environment} label="Environment" items={environments} />
      <Select bind:value={status} label="Status" items={statuses} />
      <Switch bind:checked={mine}>Only deploys I started</Switch>
    </div>
  </Drawer>
</div>
