<!-- Table head cell part (<th>). -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLThAttributes } from "svelte/elements";
  import { table } from "./table.recipe";

  type Props = HTMLThAttributes & { /** A number column: aligned to the end, tabular figures. */ numeric?: boolean; /** The column that gives way (a title): it takes the room left and cuts its text, with a title. */ truncate?: boolean; children?: Snippet };
  let { numeric = false, truncate = false, scope = "col", class: className, children, ...rest }: Props = $props();
</script>

<th data-slot="table-head" {scope} class={table({ numeric, truncate }).head({ class: className as string | undefined })} {...rest}>{@render children?.()}</th>
