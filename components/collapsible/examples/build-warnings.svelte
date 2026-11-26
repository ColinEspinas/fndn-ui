<script lang="ts">
  import { Collapsible } from "@fndn/svelte";
</script>

<!-- inline: a text-sized header on the line, for details under a message -->
<div class="flex w-80 flex-col gap-1 text-md text-ink">
  <p>docs-site is live on Production.</p>
  <Collapsible
    variant="inline"
    label="Built with 2 warnings"
    detail="The image hero.png is 2.4 MB, over the 1 MB budget. The page /changelog has no description."
  />
</div>
