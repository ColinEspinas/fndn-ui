<script lang="ts">
  import { Splitter } from "@fndn/svelte";

  const files = ["deliver.ts", "retry.ts", "verify.ts", "webhooks.test.ts"];
  const code = [
    "retry(() => post(event), {",
    "  attempts: 5,",
    "  backoff: \"exponential\",",
    "});",
  ];
  let size = $state([30, 70]);
</script>

<div class="h-[136px] w-full">
  <Splitter
    bind:size
    panels={[
      { id: "files", minSize: 25 },
      { id: "editor", minSize: 40 },
    ]}
  >
    {#snippet panel({ panel: item })}
      {#if item.id === "files"}
        <ul class="flex flex-col gap-0.5 p-1.5 text-sm text-ink-2" aria-label="Files">
          {#each files as file (file)}
            <li class={`truncate rounded-control px-2 py-1 ${file === "deliver.ts" ? "bg-hover text-ink" : ""}`}>{file}</li>
          {/each}
        </ul>
      {:else}
        <pre class="p-3 font-mono text-xs leading-relaxed text-ink">{code.join("\n")}</pre>
      {/if}
    {/snippet}
  </Splitter>
</div>
