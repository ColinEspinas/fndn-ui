<script lang="ts">
  import CaretLeft from "phosphor-svelte/lib/CaretLeftIcon";
  import CaretRight from "phosphor-svelte/lib/CaretRightIcon";
  import { Button, ButtonGroup } from "@fndn/svelte";

  /* previous / next as one joined pair; the range beside it says where you are */
  const TOTAL = 1284;
  const PER_PAGE = 20;

  let page = $state(1);
  const last = Math.ceil(TOTAL / PER_PAGE) - 1;
  const from = $derived(page * PER_PAGE + 1);
  const to = $derived(Math.min(TOTAL, from + PER_PAGE - 1));
</script>

<div class="flex items-center gap-3">
  <span class="text-sm text-ink-2 tabular-nums">{from}–{to} of 1,284 members</span>
  <ButtonGroup label="Pages">
    <Button size="sm" square aria-label="Previous page" disabled={page === 0} onclick={() => page--}>
      {#snippet icon()}<CaretLeft data-slot="icon" weight="bold" />{/snippet}
    </Button>
    <Button size="sm" square aria-label="Next page" disabled={page === last} onclick={() => page++}>
      {#snippet icon()}<CaretRight data-slot="icon" weight="bold" />{/snippet}
    </Button>
  </ButtonGroup>
</div>
