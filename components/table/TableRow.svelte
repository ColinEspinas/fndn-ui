<!-- Table row part (<tr>). -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { table } from "./table.recipe";

  type Props = HTMLAttributes<HTMLTableRowElement> & { children?: Snippet };
  let { class: className, children, ...rest }: Props = $props();
</script>

<tr data-slot="table-row" class={table().row({ class: className as string | undefined })} {...rest}>{@render children?.()}</tr>
