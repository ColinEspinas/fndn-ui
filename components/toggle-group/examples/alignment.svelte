<script lang="ts">
  import TextAlignCenter from "phosphor-svelte/lib/TextAlignCenterIcon";
  import TextAlignLeft from "phosphor-svelte/lib/TextAlignLeftIcon";
  import TextAlignRight from "phosphor-svelte/lib/TextAlignRightIcon";
  import { ToggleGroup } from "@fndn/svelte";

  /* one at most, never none: alignment always has a value; icon-only items are named by their labels */
  const alignments = [
    { value: "left", label: "Align left", icon: TextAlignLeft },
    { value: "center", label: "Align center", icon: TextAlignCenter },
    { value: "right", label: "Align right", icon: TextAlignRight },
  ];
</script>

<ToggleGroup
  aria-label="Alignment"
  variant="ghost"
  size="sm"
  shape="rounded"
  square
  muted
  deselectable={false}
  value={["left"]}
  items={alignments}
/>
