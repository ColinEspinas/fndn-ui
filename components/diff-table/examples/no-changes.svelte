<script lang="ts">
  import { DiffTable } from "@fndn/svelte";

  const columns = ["Plan", "Billing", "Price"];

  const labels = { empty: "Prices already match the plan sheet" };
</script>

<DiffTable title="Proposed price changes" columns={columns} rows={[]} labels={labels} />
