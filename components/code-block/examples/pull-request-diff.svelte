<script lang="ts">
  import { CodeBlock, type CodeDiffRow } from "@fndn/svelte";

  const diff: CodeDiffRow[] = [
    {
      old: 1,
      cur: 1,
      type: "ctx",
      pieces: [{ text: "export async function deliver(event: WebhookEvent) {" }],
    },
    {
      old: 2,
      cur: null,
      type: "del",
      pieces: [
        { text: "  return " },
        { text: "post(event.url, event.body);", change: "del" },
      ],
    },
    {
      old: null,
      cur: 2,
      type: "add",
      pieces: [
        { text: "  return " },
        { text: "retry(() => post(event.url, event.body), {", change: "add" },
      ],
    },
    { old: null, cur: 3, type: "add", pieces: [{ text: "    attempts: 5," }] },
    { old: null, cur: 4, type: "add", pieces: [{ text: "    backoff: \"exponential\"," }] },
    { old: null, cur: 5, type: "add", pieces: [{ text: "  });" }] },
    { old: 3, cur: 6, type: "ctx", pieces: [{ text: "}" }] },
  ];
</script>

<CodeBlock variant="diff" filename="src/webhooks/deliver.ts" {diff} />
