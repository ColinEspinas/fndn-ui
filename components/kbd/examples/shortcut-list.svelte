<script lang="ts">
  import { Kbd } from "@fndn/svelte";

  /* a shortcuts list: the action at the start, its keys at the end; a sequence reads "then" */
  const shortcuts = [
    { action: "Search projects and people", keys: [["⌘", "K"]] },
    { action: "New project", keys: [["C"]] },
    { action: "Go to deploys", keys: [["G"], ["D"]] },
    { action: "Toggle the sidebar", keys: [["⌘", "B"]] },
  ];
</script>

<dl class="flex w-80 flex-col gap-2 text-sm">
  {#each shortcuts as s (s.action)}
    <div class="flex items-center justify-between gap-4">
      <dt class="text-ink-2">{s.action}</dt>
      <dd class="flex items-center gap-1 text-xs text-ink-2">
        {#each s.keys as k, i (i)}<span class="contents">{#if i > 0}then{/if}<Kbd keys={k} /></span>{/each}
      </dd>
    </div>
  {/each}
</dl>
