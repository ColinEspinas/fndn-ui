<script lang="ts">
  import { FilterTable } from "@fndn/svelte";

  const labels = {
    filters: "Filter tickets by status",
    region: "Support tickets",
    empty: "No tickets with this status",
    none: "No tickets yet. New requests from customers land here.",
    columns: { task: "Ticket", owner: "Customer" },
    statuses: { todo: "Open", progress: "Pending", done: "Solved" },
  };
</script>

<FilterTable rows={[]} labels={labels} />
