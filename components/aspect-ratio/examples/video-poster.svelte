<script lang="ts">
  import Play from "phosphor-svelte/lib/PlayIcon";
  import { AspectRatio, Button } from "@fndn/svelte";
</script>

<figure class="flex w-80 max-w-full flex-col gap-2">
  <AspectRatio ratio={16 / 9} class="rounded-card bg-[linear-gradient(135deg,var(--fndn-accent),var(--fndn-ink))]">
    <div class="grid place-items-center">
      <Button variant="outline" square aria-label="Play: Preview environments in two minutes">
        {#snippet icon()}<Play data-slot="icon" weight="fill" />{/snippet}
      </Button>
    </div>
  </AspectRatio>
  <figcaption class="text-sm text-ink-2">Preview environments in two minutes · 2:14</figcaption>
</figure>
