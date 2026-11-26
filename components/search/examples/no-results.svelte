<script lang="ts">
  import { Search } from "@fndn/svelte";

  const items = ["web-app", "billing-api", "mobile", "docs-site", "data-pipeline"];
  let query = $state("kubernetes");
</script>

<Search
  bind:query
  class="w-80"
  {items}
  label="Search projects"
  placeholder="Search projects…"
  emptyTitle="No projects match"
  emptyHint="Search by project name, like web-app"
/>
