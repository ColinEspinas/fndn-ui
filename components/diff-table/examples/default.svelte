<script lang="ts">
  import { DiffTable, type DiffTableRow } from "@fndn/svelte";

  const columns: [string, string, string] = ["Plan", "Billing", "Price"];

  const rows: DiffTableRow[] = [
    {
      key: "team-49",
      name: "Team",
      category: "Monthly",
      tone: "accent",
      value: "$49 per seat",
      change: "removed",
    },
    {
      key: "team-59",
      name: "Team",
      category: "Monthly",
      tone: "accent",
      value: "$59 per seat",
      change: "added",
    },
    {
      key: "business",
      name: "Business",
      category: "Monthly",
      tone: "accent",
      value: "$99 per seat",
      change: "unchanged",
    },
  ];
</script>

<DiffTable title="Proposed price changes" columns={columns} rows={rows} />
