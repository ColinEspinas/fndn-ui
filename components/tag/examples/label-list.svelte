<script lang="ts">
  import { Count, Tag } from "@fndn/svelte";

  const labels = [
    { name: "bug", tone: "red", open: 14 },
    { name: "feature", tone: "green", open: 32 },
    { name: "docs", tone: "blue", open: 6 },
  ] as const;
</script>

<!-- a dot carries the hue where the label stands on its own -->
<ul class="flex w-48 flex-col gap-1.5 text-sm">
  {#each labels as label (label.name)}
    <li class="flex items-center justify-between gap-3">
      <Tag tone={label.tone} dot>{label.name}</Tag>
      <Count>{label.open}</Count>
    </li>
  {/each}
</ul>
