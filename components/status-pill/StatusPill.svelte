<!-- Tinted pill with a leading status dot. -->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import { afterPaint } from "../lib/paint";
  import { truncationTitles } from "../lib/truncate";
  import { statusPill } from "./status-pill.recipe";

  export type StatusPillTone = "neutral" | "accent" | "green" | "orange" | "red" | "blue";
  export type StatusPillSize = "md" | "sm";
  export type StatusPillDotTone = "accent" | "green" | "orange" | "red" | "blue" | "purple" | "cyan" | "yellow" | "pink";
  type Props = HTMLAttributes<HTMLSpanElement> & {
    tone?: StatusPillTone;
    size?: StatusPillSize;
    /** Leading dot. Default: true. */
    dot?: boolean;
    /** Circle with a check in place of the dot, for a finished state; it pops in when it appears after the first paint. */
    mark?: boolean;
    /** A glyph after the label (a retry arrow). */
    trailingIcon?: Snippet;
    /** A neutral pill whose dot alone takes this colour (a category). */
    dotTone?: StatusPillDotTone;
    children?: Snippet;
  };

  let { tone = "neutral", size = "md", dot = true, mark = false, trailingIcon, dotTone, class: className, children, ...rest }: Props = $props();
  const showDot = $derived(!mark && dot);
  const r = $derived(statusPill({ tone, size, dotTone, mark: !!mark }));

  /* a label cut by its ellipsis carries its full text as a title */
  let label = $state<HTMLElement | null>(null);
  $effect(() => truncationTitles(label));

  /* the mark pops in only when it appears after the first paint: data-enter only after it (lib/paint.ts) */
  let enter = $state(false);
  $effect(() => (enter ? undefined : afterPaint(() => { enter = true; })));
</script>

<span
  data-slot="status-pill"
  class={r.base({ class: className as string | undefined })}
  data-enter={enter ? "" : undefined}
  {...rest}
>
  {#if mark}<span data-slot="status-pill-mark" class={r.mark()} aria-hidden="true"><Check data-slot="icon" weight="bold" /></span>{/if}
  {#if showDot}<span data-slot="status-pill-dot" class={r.dot()} aria-hidden="true"></span>{/if}
  {#if children}<span bind:this={label} data-slot="status-pill-label" class={r.label()}>{@render children()}</span>{/if}
  {#if trailingIcon}<span data-slot="status-pill-trailing" class={r.trailing()} aria-hidden="true">{@render trailingIcon()}</span>{/if}
</span>
