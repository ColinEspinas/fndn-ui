<script lang="ts">
  import { ScrollArea } from "@fndn/svelte";

  const events = [
    { id: 1, who: "Maya Chen", what: "deployed web-app to Production", when: "2 min ago" },
    { id: 2, who: "Daniel Okafor", what: "merged #482 Add retry to webhook delivery", when: "14 min ago" },
    { id: 3, who: "Priya Raman", what: "invited aiko@northwind.example", when: "1 h ago" },
    { id: 4, who: "Lucas Moreau", what: "rolled back billing-api on Staging", when: "3 h ago" },
    { id: 5, who: "Aiko Tanaka", what: "created the branch feat/usage-alerts", when: "Yesterday" },
    { id: 6, who: "Sofia Alvarez", what: "rotated the API key nw_live_…4f2a", when: "Yesterday" },
    { id: 7, who: "Jonas Weber", what: "changed the plan from Team to Business", when: "Nov 12, 2026" },
    { id: 8, who: "Maya Chen", what: "created the project data-pipeline", when: "Nov 10, 2026" },
  ];
</script>

<ScrollArea class="h-[136px] w-full" aria-label="Recent activity">
  <ul class="flex flex-col gap-3 pe-3 text-sm">
    {#each events as event (event.id)}
      <li>
        <p class="text-ink-2"><span class="font-medium text-ink">{event.who}</span> {event.what}</p>
        <p class="text-xs text-ink-2">{event.when}</p>
      </li>
    {/each}
  </ul>
</ScrollArea>
