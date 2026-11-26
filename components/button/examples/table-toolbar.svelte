<script lang="ts">
  import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
  import FunnelSimple from "phosphor-svelte/lib/FunnelSimpleIcon";
  import Plus from "phosphor-svelte/lib/PlusIcon";
  import { Button } from "@fndn/svelte";
</script>

<!-- sm (28px) in a toolbar above a table: every control of the row shares the size -->
<div class="flex w-80 items-center gap-2">
  <Button size="sm">
    {#snippet icon()}<FunnelSimple data-slot="icon" weight="bold" />{/snippet}
    Filter
  </Button>
  <Button size="sm">
    Newest
    {#snippet trailingIcon()}<CaretDown data-slot="icon" weight="bold" />{/snippet}
  </Button>
  <Button variant="primary" size="sm" class="ms-auto">
    {#snippet icon()}<Plus data-slot="icon" weight="bold" />{/snippet}
    New project
  </Button>
</div>
