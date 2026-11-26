<script lang="ts">
  import { Collapsible } from "@fndn/svelte";

  const projects = ["web-app", "billing-api", "mobile", "data-pipeline"];
  let open = $state(true);
</script>

<!-- section: a quiet header with the caret first, over a group of links -->
<Collapsible variant="section" caret="start" bind:open={open} label="Projects" style="width: 240px">
  <ul class="flex flex-col px-2.5 pb-1 text-sm">
    {#each projects as project (project)}
      <li>
        <a href={`#${project}`} class="block rounded-chip py-1 text-ink-2 hover:text-ink">{project}</a>
      </li>
    {/each}
  </ul>
</Collapsible>
