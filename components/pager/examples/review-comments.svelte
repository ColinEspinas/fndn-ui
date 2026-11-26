<script lang="ts">
  import { Pager } from "@fndn/svelte";

  const comments = [
    { author: "Priya Raman", file: "deliver.ts:42", text: "Should the backoff cap at 5 minutes? A dead endpoint retries for hours now." },
    { author: "Lucas Moreau", file: "retry-policy.ts:8", text: "Rename MAX to MAX_ATTEMPTS so it reads at the call site." },
    { author: "Priya Raman", file: "deliver.test.ts:117", text: "Add a case for a 410 Gone: we should stop at once." },
    { author: "Aiko Tanaka", file: "README.md:56", text: "Document the new retry headers for customers." },
  ];

  let page = $state(0);
  const comment = $derived(comments[page]);
</script>

<div class="flex w-80 flex-col gap-2">
  <div class="flex items-center justify-between gap-3">
    <span class="text-sm font-medium text-ink">Unresolved comments</span>
    <Pager
      bind:page
      count={comments.length}
      layout="start"
      unit="Comment"
      label="Unresolved comments"
      prevLabel="Previous comment"
      nextLabel="Next comment"
    />
  </div>
  {#if comment}
    <div class="flex flex-col gap-0.5 text-sm">
      <span class="text-xs text-ink-2">{comment.author} on <span class="font-mono">{comment.file}</span></span>
      <p class="m-0 text-ink-2">{comment.text}</p>
    </div>
  {/if}
</div>
