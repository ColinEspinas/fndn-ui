<script lang="ts">
  import File from "phosphor-svelte/lib/FileIcon";
  import { CodeView, Tabs } from "@fndn/svelte";

  const files = [
    {
      path: "src/middleware/rate-limit.ts",
      name: "rate-limit.ts",
      code: [
        "import { buckets } from \"./store\";",
        "",
        "const WINDOW_MS = 60_000;",
        "const LIMIT = 120;",
        "",
        "export function rateLimit(key: string, now = Date.now(), options: { limit?: number; windowMs?: number } = {}) {",
        "  const bucket = buckets.get(key) ?? { count: 0, windowStart: now };",
        "  if (now - bucket.windowStart >= (options.windowMs ?? WINDOW_MS)) {",
        "    bucket.count = 0;",
        "    bucket.windowStart = now;",
        "  }",
        "  bucket.count += 1;",
        "  buckets.set(key, bucket);",
        "  return bucket.count <= (options.limit ?? LIMIT);",
        "}",
      ].join("\n"),
    },
    { path: "package.json", name: "package.json", code: "{\n  \"name\": \"billing-api\",\n  \"version\": \"2.14.0\",\n  \"private\": true\n}" },
  ];

  let open = $state(files);
  let active = $state(files[0]!.path);
  const items = $derived(open.map((file) => ({ value: file.path, label: file.name, icon: File })));
  const fileOf = (path: string) => open.find((file) => file.path === path)!;
</script>

<!-- an editor pane: closable file tabs over an editable code view (lines never wrap, the gutter
     stays while the code scrolls sideways) -->
<div class="h-64 w-full max-w-[560px] overflow-hidden rounded-card bg-canvas shadow-card">
  {#if open.length}
    <Tabs
      bind:value={active}
      size="xs"
      closable
      fill
      aria-label="Open files"
      {items}
      onclose={(path) => (open = open.filter((file) => file.path !== path))}
    >
      {#snippet panel({ item })}
        <CodeView value={fileOf(item.value).code} onvaluechange={(code) => (fileOf(item.value).code = code)} editable fill wrap={false} label={item.value} />
      {/snippet}
    </Tabs>
  {:else}
    <p class="p-4 text-sm text-ink-2">No open files</p>
  {/if}
</div>
