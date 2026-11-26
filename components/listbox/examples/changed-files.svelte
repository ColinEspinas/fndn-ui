<script lang="ts">
  import { Listbox, type ListboxItem } from "@fndn/svelte";

  /* an editor's change list: xs rows, the folder dimmed after the name, a status letter at the end in
   * its tone (M modified, A added, D deleted) */
  const changes: ListboxItem[] = [
    { value: "src/middleware/rate-limit.ts", label: "rate-limit.ts", description: "src/middleware", meta: "M", metaTone: "orange" },
    { value: "src/webhooks/retry-policy.ts", label: "retry-policy.ts", description: "src/webhooks", meta: "A", metaTone: "green" },
    { value: "src/webhooks/legacy-queue.ts", label: "legacy-queue.ts", description: "src/webhooks", meta: "D", metaTone: "red" },
    { value: "package.json", label: "package.json", meta: "M", metaTone: "orange" },
  ];

  let selected = $state(["src/middleware/rate-limit.ts"]);
</script>

<Listbox items={changes} bind:value={selected} size="xs" aria-label="Changes" style="width: 280px" />
