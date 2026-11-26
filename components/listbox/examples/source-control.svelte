<script lang="ts">
  import { Listbox, type ListboxItem } from "@fndn/svelte";

  /* flush: the change list of an editor's source-control pane. No card: the rows belong to the pane,
   * run edge to edge, and the pane's heading sits on the same inset as their text */
  const changes: ListboxItem[] = [
    { value: "src/middleware/rate-limit.ts", label: "rate-limit.ts", description: "src/middleware", meta: "M", metaTone: "orange" },
    { value: "src/webhooks/retry-policy.ts", label: "retry-policy.ts", description: "src/webhooks", meta: "A", metaTone: "green" },
    { value: "src/webhooks/legacy-queue.ts", label: "legacy-queue.ts", description: "src/webhooks", meta: "D", metaTone: "red" },
    { value: "package.json", label: "package.json", meta: "M", metaTone: "orange" },
  ];

  let selected = $state(["src/middleware/rate-limit.ts"]);
</script>

<section class="flex w-[280px] flex-col gap-1 rounded-card bg-inset p-1">
  <h3 class="m-0 px-2 pt-1 text-2xs font-medium uppercase tracking-wide text-ink-2">Changes</h3>
  <Listbox items={changes} bind:value={selected} variant="flush" size="xs" aria-label="Changes" />
</section>
