<!-- The table's name, under the rows (<caption>). Put it first inside <Table> (HTML wants the caption first). -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { table } from "./table.recipe";

  type Props = HTMLAttributes<HTMLElement> & { children?: Snippet };
  let { class: className, children, ...rest }: Props = $props();
</script>

<caption data-slot="table-caption" class={table().caption({ class: className as string | undefined })} {...rest}>{@render children?.()}</caption>
