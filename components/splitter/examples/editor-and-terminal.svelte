<script lang="ts">
  import { Splitter } from "@fndn/svelte";

  const code = [
    "test(\"retries a failed delivery\", async () => {",
    "  server.failNext(2);",
    "  await deliver(event);",
    "  expect(server.calls).toBe(3);",
    "});",
  ];
  const output = ["$ pnpm test webhooks", "✓ webhooks.test.ts (12 tests) 840ms", "Tests  12 passed (12)"];
  let size = $state([60, 40]);
</script>

<div class="h-64 w-full max-w-md rounded-card bg-surface shadow-card">
  <Splitter
    bind:size
    orientation="vertical"
    grip
    panels={[
      { id: "editor", minSize: 25 },
      { id: "terminal", minSize: 20 },
    ]}
  >
    {#snippet panel({ panel: item })}
      {#if item.id === "editor"}
        <pre class="p-3 font-mono text-xs leading-relaxed text-ink">{code.join("\n")}</pre>
      {:else}
        <pre class="p-3 font-mono text-xs leading-relaxed text-ink-2">{output.join("\n")}</pre>
      {/if}
    {/snippet}
  </Splitter>
</div>
