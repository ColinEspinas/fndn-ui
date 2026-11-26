<script lang="ts">
  import Monitor from "phosphor-svelte/lib/MonitorIcon";
  import Moon from "phosphor-svelte/lib/MoonIcon";
  import Sun from "phosphor-svelte/lib/SunIcon";
  import { SegmentedControl } from "@fndn/svelte";

  /* icons: square cells; each label stays in the markup as the accessible name */
  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];
  let theme = $state("system");
</script>

<div class="flex items-center gap-3">
  <span class="text-sm text-ink-2">Theme</span>
  <SegmentedControl bind:value={theme} options={themes} size="sm" icons aria-label="Theme">
    {#snippet icon({ option })}
      {#if option.value === "light"}<Sun data-slot="icon" weight="fill" />
      {:else if option.value === "dark"}<Moon data-slot="icon" weight="fill" />
      {:else}<Monitor data-slot="icon" weight="bold" />{/if}
    {/snippet}
  </SegmentedControl>
</div>
