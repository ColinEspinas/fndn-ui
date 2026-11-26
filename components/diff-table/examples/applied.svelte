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
      key: "business",
      name: "Business",
      category: "Monthly",
      tone: "accent",
      value: "$99 per seat",
      change: "unchanged",
    },
  ];

  let accepted = $state(true);
</script>

<DiffTable title="Proposed price changes" columns={columns} rows={rows} bind:accepted={accepted} />
