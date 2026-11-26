<script lang="ts">
  import { Button, RecordsTable } from "@fndn/svelte";

  const columns = [
    { key: "company", label: "Company", width: 190 },
    { key: "plan", label: "Plan", width: 100 },
    { key: "seats", label: "Seats", type: "number" as const, width: 90 },
  ];

  const rows = [
    { id: "brightline", company: "Brightline Dental", plan: "Business", seats: 48 },
    { id: "kestrel", company: "Kestrel Logistics", plan: "Team", seats: 112 },
    { id: "juniper", company: "Juniper Health", plan: "Enterprise", seats: 1240 },
  ];

  /* a click (or Enter) on a row opens the account; the checkbox stays its own target, and the
   * selection bar carries what can be done to every selected account */
  let opened = $state<string | null>(null);
</script>

<div class="flex flex-col gap-2" style="width: 400px">
  <RecordsTable {columns} {rows} onrowopen={(id) => (opened = id)}>
    {#snippet selectionActions(selected)}
      <Button variant="ghost" size="sm" onclick={() => (opened = `${selected.length} exported`)}>Export</Button>
    {/snippet}
  </RecordsTable>
  <p class="text-sm text-ink-2" role="status">{opened ? `Opened: ${opened}` : "Click a row to open it"}</p>
</div>
