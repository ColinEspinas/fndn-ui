<script lang="ts">
  import ArrowClockwise from "phosphor-svelte/lib/ArrowClockwiseIcon";
  import ArrowSquareOut from "phosphor-svelte/lib/ArrowSquareOutIcon";
  import DownloadSimple from "phosphor-svelte/lib/DownloadSimpleIcon";
  import { Button, ButtonGroup } from "@fndn/svelte";
</script>

<!-- vertical: a stack of related actions in a narrow side panel -->
<ButtonGroup label="Deploy dpl_7f3a9c" orientation="vertical" class="w-52">
  <Button size="sm">
    {#snippet icon()}<ArrowSquareOut data-slot="icon" weight="bold" />{/snippet}
    Open preview
  </Button>
  <Button size="sm">
    {#snippet icon()}<DownloadSimple data-slot="icon" weight="bold" />{/snippet}
    Download build log
  </Button>
  <Button size="sm">
    {#snippet icon()}<ArrowClockwise data-slot="icon" weight="bold" />{/snippet}
    Redeploy
  </Button>
</ButtonGroup>
