<script lang="ts">
  import { Button, Progress } from "@fndn/svelte";

  let value = $state(0);
  let running = $state(false);
  $effect(() => {
    if (!running) return;
    const timer = setInterval(() => (value = Math.min(100, value + 7 + Math.round(Math.random() * 12))), 450);
    return () => clearInterval(timer);
  });
  const done = $derived(value >= 100);
</script>

<div class="flex w-full max-w-sm flex-col gap-3">
  <Progress {value} label={done ? "Uploaded data-pipeline-2026-11.csv" : "Uploading data-pipeline-2026-11.csv"} showValue tone={done ? "green" : "accent"} />
  <Button size="sm" class="self-start" onclick={() => { value = 0; running = true; }}>{done || !running ? "Start upload" : "Restart"}</Button>
</div>
