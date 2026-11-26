<script lang="ts">
  import { Slider } from "@fndn/svelte";

  /* sm: a smaller track and thumb for a dense settings panel */
  const percent = (v: number) => `${v}%`;

  let logs = $state([25]);
  let traces = $state([10]);
</script>

<div class="flex w-72 flex-col gap-4">
  <Slider bind:value={logs} size="sm" label="Log sampling" showValue formatValue={percent} />
  <Slider bind:value={traces} size="sm" label="Trace sampling" showValue formatValue={percent} />
</div>
