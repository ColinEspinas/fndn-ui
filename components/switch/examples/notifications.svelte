<script lang="ts">
  import { Separator, Switch } from "@fndn/svelte";

  /* a settings list: label at the start, switch at the end of each row */
  const settings = [
    { id: "deploy-failed", label: "A deploy fails" },
    { id: "review-requested", label: "Someone requests your review" },
    { id: "weekly-usage", label: "Weekly usage summary for Northwind" },
  ];

  let on = $state<Record<string, boolean>>({ "deploy-failed": true, "review-requested": true, "weekly-usage": false });
</script>

<div class="flex w-80 flex-col">
  {#each settings as s, i (s.id)}
    <div>
      {#if i > 0}<Separator class="my-2" />{/if}
      <div class="flex items-center justify-between gap-4">
        <span id={s.id} class="text-sm text-ink">{s.label}</span>
        <Switch bind:checked={on[s.id]} size="sm" aria-labelledby={s.id} />
      </div>
    </div>
  {/each}
</div>
