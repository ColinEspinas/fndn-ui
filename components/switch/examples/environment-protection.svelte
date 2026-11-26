<script lang="ts">
  import { Switch } from "@fndn/svelte";

  /* no visible label in a row: the switch is named by `label` (its aria-label) */
  let environments = $state([
    { name: "Production", protected: true },
    { name: "Staging", protected: true },
    { name: "Preview", protected: false },
  ]);
</script>

<table class="w-80 text-sm">
  <thead>
    <tr class="text-start text-xs text-ink-2">
      <th class="pb-2 text-start font-medium">Environment</th>
      <th class="pb-2 text-end font-medium">Password</th>
    </tr>
  </thead>
  <tbody>
    {#each environments as env (env.name)}
      <tr>
        <td class="py-1.5 text-ink">{env.name}</td>
        <td class="py-1.5 text-end">
          <Switch bind:checked={env.protected} size="sm" label={`Password-protect ${env.name}`} />
        </td>
      </tr>
    {/each}
  </tbody>
</table>
