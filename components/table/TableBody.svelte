<!-- Table body part (<tbody>). -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { table } from "./table.recipe";

  type Props = HTMLAttributes<HTMLTableSectionElement> & { children?: Snippet };
  let { class: className, children, ...rest }: Props = $props();
</script>

<tbody data-slot="table-body" class={table().body({ class: className as string | undefined })} {...rest}>{@render children?.()}</tbody>
