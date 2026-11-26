<script lang="ts">
  import { Pager } from "@fndn/svelte";

  const insights = [
    "Bandwidth is up 18% this week, mostly from docs-site.",
    "billing-api builds take 2m 10s; caching node_modules would save about 50s.",
    "3 preview deploys have been idle for 30 days.",
  ];

  /* a short set read in a loop: it wraps at the ends and the digits roll */
  let page = $state(0);
</script>

<div class="flex w-80 flex-col gap-2">
  <p class="m-0 min-h-10 text-sm text-ink-2">{insights[page]}</p>
  <Pager
    bind:page
    count={insights.length}
    loop
    reel
    layout="start"
    label="Usage insights"
    prevLabel="Previous insight"
    nextLabel="Next insight"
  />
</div>
