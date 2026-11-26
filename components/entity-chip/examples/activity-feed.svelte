<script lang="ts">
  import { EntityChip } from "@fndn/svelte";

  const activity = [
    { id: 1, who: "Maya Chen", color: "var(--fndn-tag-orange)", action: "invited", target: "Priya Raman", targetColor: "var(--fndn-tag-purple)", when: "2 min ago" },
    { id: 2, who: "Daniel Okafor", color: "var(--fndn-tag-blue)", action: "deployed", target: "web-app", targetColor: "var(--fndn-tag-green)", when: "1 h ago" },
  ];
</script>

<ul class="flex w-80 flex-col gap-3 text-md text-ink">
  {#each activity as item (item.id)}
    <li>
      <EntityChip name={item.who} color={item.color} /> {item.action} <EntityChip name={item.target} color={item.targetColor} /> <span class="text-sm text-ink-2">{item.when}</span>
    </li>
  {/each}
</ul>
