<!-- Table cell part (<td>). -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLTdAttributes } from "svelte/elements";
  import { table } from "./table.recipe";

  type Props = HTMLTdAttributes & { /** A number column: aligned to the end, tabular figures. */ numeric?: boolean; /** The column that gives way (a title): it takes the room left and cuts its text, with a title. */ truncate?: boolean; children?: Snippet };
  let { numeric = false, truncate = false, class: className, children, ...rest }: Props = $props();
</script>

<td data-slot="table-cell" class={table({ numeric, truncate }).cell({ class: className as string | undefined })} {...rest}>{@render children?.()}</td>
