<script lang="ts">
  import { FilterTable } from "@fndn/svelte";

  const rows = [
    {
      task: "Reminder SMS sent twice for the same booking",
      date: "Nov 16",
      status: "todo",
      owner: "Brightline Dental",
    },
    {
      task: "Calendar sync stopped after Google re-auth",
      date: "Nov 15",
      status: "progress",
      owner: "Kestrel Logistics",
    },
    {
      task: "Can't export invoices as CSV",
      date: "Nov 14",
      status: "todo",
      owner: "Juniper Health",
    },
    {
      task: "Add a second location to our plan",
      date: "Nov 12",
      status: "progress",
      owner: "Saint Aldric Pediatric Dental Group",
    },
    {
      task: "Booking page shows the wrong time zone",
      date: "Nov 10",
      status: "done",
      owner: "Orbit Studio",
    },
  ];

  const labels = {
    filters: "Filter tickets by status",
    region: "Support tickets",
    empty: "No tickets with this status",
    none: "No tickets yet",
    columns: { task: "Ticket", owner: "Customer" },
    statuses: { todo: "Open", progress: "Pending", done: "Solved" },
  };

  let filter = $state("todo");
</script>

<FilterTable rows={rows} labels={labels} bind:filter={filter} />
