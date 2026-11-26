<script lang="ts">
  import { Pager } from "@fndn/svelte";

  const alerts = [
    "Error rate above 2% on billing-api",
    "p95 latency 1.8 s on web-app in Singapore",
    "data-pipeline job failed 3 times since 09:00",
    "Certificate for docs.northwind.example expires in 6 days",
  ];

  /* alerts stacked on top of each other page up and down */
  let page = $state(0);
</script>

<div class="flex w-80 items-center gap-3">
  <p class="m-0 flex-1 text-sm text-ink">{alerts[page]}</p>
  <Pager
    bind:page
    count={alerts.length}
    orientation="vertical"
    separator="/"
    unit="Alert"
    label="Open alerts"
    prevLabel="Previous alert"
    nextLabel="Next alert"
  />
</div>
