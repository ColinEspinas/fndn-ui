<script lang="ts">
  import Image from "phosphor-svelte/lib/ImageIcon";
  import { AspectRatio } from "@fndn/svelte";

  const slots = [
    { ratio: 1, name: "Workspace logo", size: "512 × 512" },
    { ratio: 1.91, name: "Social card", size: "1200 × 630" },
    { ratio: 9 / 16, name: "Phone screenshot", size: "1080 × 1920" },
  ];
</script>

<div class="grid w-[400px] max-w-full grid-cols-3 items-end gap-3">
  {#each slots as slot (slot.name)}
    <div class="flex min-w-0 flex-col gap-1.5">
      <AspectRatio ratio={slot.ratio} class="rounded-control bg-inset">
        <div class="grid place-items-center text-ink-3">
          <Image data-slot="icon" weight="bold" class="text-xl" aria-hidden="true" />
        </div>
      </AspectRatio>
      <p class="text-sm text-ink">{slot.name}</p>
      <p class="text-xs text-ink-2 tabular-nums">{slot.size}</p>
    </div>
  {/each}
</div>
