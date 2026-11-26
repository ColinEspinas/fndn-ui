<script lang="ts">
  import RocketLaunch from "phosphor-svelte/lib/RocketLaunchIcon";
  import { Button } from "@fndn/svelte";

  /* busy: the spinner takes the icon's place, the button keeps its width and its focus, and a second
   * press does nothing; the status beside it says what is running */
  let busy = $state(false);
  let timer = 0;
  $effect(() => () => clearTimeout(timer));
  function deploy() {
    busy = true;
    timer = window.setTimeout(() => (busy = false), 2500);
  }
</script>

<div class="flex items-center gap-3">
  <Button variant="primary" {busy} onclick={deploy}>
    {#snippet icon()}<RocketLaunch data-slot="icon" weight="bold" />{/snippet}
    Deploy to Production
  </Button>
  <span class="text-sm text-ink-2" role="status">{busy ? "Deploying a1b2c3d…" : ""}</span>
</div>
