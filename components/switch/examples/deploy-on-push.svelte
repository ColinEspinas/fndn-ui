<script lang="ts">
  import { Switch } from "@fndn/svelte";

  /* a settings row: name and effect at the start, the switch at the end; it applies at once */
  let enabled = $state(true);
</script>

<div class="flex w-80 items-start justify-between gap-4">
  <div class="flex flex-col gap-0.5">
    <p id="deploy-on-push" class="text-sm font-medium text-ink">Deploy on push</p>
    <p id="deploy-on-push-help" class="text-sm text-ink-2">
      {enabled ? "Every push to main deploys web-app to Production." : "Deploy web-app by hand from the Deploys tab."}
    </p>
  </div>
  <Switch bind:checked={enabled} aria-labelledby="deploy-on-push" aria-describedby="deploy-on-push-help" />
</div>
