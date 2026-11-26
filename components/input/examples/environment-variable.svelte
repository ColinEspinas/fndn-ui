<script lang="ts">
  import Trash from "phosphor-svelte/lib/TrashIcon";
  import { Button, Input } from "@fndn/svelte";

  let key = $state("DATABASE_URL");
  let value = $state("postgres://web-app@db.northwind.example:5432/main");
</script>

<!-- mono for keys, values and anything copied from a terminal -->
<div class="flex w-full max-w-[400px] items-center gap-2">
  <Input bind:value={key} mono aria-label="Key" class="w-36 min-w-0" />
  <Input bind:value={value} mono aria-label="Value" class="min-w-0 flex-1" />
  <Button variant="ghost" square muted aria-label="Remove DATABASE_URL">
    {#snippet icon()}<Trash data-slot="icon" weight="bold" />{/snippet}
  </Button>
</div>
