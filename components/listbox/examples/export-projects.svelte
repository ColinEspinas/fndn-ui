<script lang="ts">
  import { Listbox } from "@fndn/svelte";

  const projects = ["web-app", "billing-api", "mobile", "docs-site", "data-pipeline"];
  let picked = $state<string[]>(["web-app", "billing-api"]);
</script>

<div class="flex flex-col gap-2" style="width: 240px">
  <Listbox items={projects} bind:value={picked} label="Projects to export" selectionMode="multiple" />
  <span class="text-sm text-ink-2">{picked.length ? `${picked.length} of ${projects.length} projects` : "Pick at least one project."}</span>
</div>
