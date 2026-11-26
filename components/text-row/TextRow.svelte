<!-- Label-left / value-right row. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { textRow } from "./text-row.recipe";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    label: string | Snippet;
    value: string | Snippet;
    meta?: string | Snippet;
  };
  let { label, value, meta, class: className, ...rest }: Props = $props();
  const r = textRow();
</script>

<div data-slot="text-row" class={r.base({ class: className as string | undefined })} {...rest}>
  <span data-slot="text-row-label" class={r.label()}>{#if typeof label === "string"}{label}{:else}{@render label()}{/if}</span>
  <span data-slot="text-row-values" class={r.values()}>
    <span data-slot="text-row-value" class={r.value()}>{#if typeof value === "string"}{value}{:else}{@render value()}{/if}</span>
    {#if meta !== undefined}<span data-slot="text-row-meta" class={r.meta()}>{#if typeof meta === "string"}{meta}{:else}{@render meta()}{/if}</span>{/if}
  </span>
</div>
