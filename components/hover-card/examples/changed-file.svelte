<script lang="ts">
  import { HoverCard, type HoverCardLine } from "@fndn/svelte";

  const lines: HoverCardLine[] = [
    { text: "for (let attempt = 1; ; attempt++) {", tone: "ctx" },
    { text: "  await send(endpoint, event);", tone: "del" },
    { text: "  const res = await send(endpoint, event);", tone: "add" },
    { text: "  if (res.ok || attempt === MAX_ATTEMPTS) break;", tone: "add" },
    { text: "  await sleep(backoff(attempt));", tone: "add" },
  ];
</script>

<HoverCard
  triggerLabel="src/webhooks/deliver.ts"
  title="src/webhooks/deliver.ts"
  add={24}
  del={6}
  {lines}
/>
