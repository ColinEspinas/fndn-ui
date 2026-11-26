<!-- Table header part (<thead>). -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { table } from "./table.recipe";

  type Props = HTMLAttributes<HTMLTableSectionElement> & { children?: Snippet };
  let { class: className, children, ...rest }: Props = $props();
</script>

<thead data-slot="table-header" class={table().header({ class: className as string | undefined })} {...rest}>{@render children?.()}</thead>
