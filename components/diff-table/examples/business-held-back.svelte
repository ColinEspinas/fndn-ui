<script lang="ts">
  import { DiffTable } from "@fndn/svelte";

  const columns = ["Plan", "Billing", "Price"];

  const rows = [
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
      key: "team-annual",
      name: "Team",
      category: "Annual",
      tone: "green",
      value: "$490 per seat",
      change: "unchanged",
    },
    {
      key: "business-99",
      name: "Business",
      category: "Monthly",
      tone: "accent",
      value: "$99 per seat",
      change: "removed",
    },
    {
      key: "business-119",
      name: "Business",
      category: "Monthly",
      tone: "accent",
      value: "$119 per seat",
      change: "added",
    },
  ];

  let included = $state({ "business-99": false, "business-119": false });
</script>

<DiffTable title="Proposed price changes" columns={columns} rows={rows} bind:included={included} />
