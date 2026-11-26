<!-- A placeholder bar for a loading row (the data form draws them itself). -->
<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { table } from "./table.recipe";

  type Props = HTMLAttributes<HTMLSpanElement> & { /** In a number column: at the end. */ numeric?: boolean };
  let { numeric = false, class: className, ...rest }: Props = $props();
</script>

<span data-slot="table-skeleton" class={table({ numeric }).skeleton({ class: className as string | undefined })} aria-hidden="true" {...rest}></span>
