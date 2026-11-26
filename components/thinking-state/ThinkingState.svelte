<!-- Expandable agent trace, fully controlled. -->
<script lang="ts">
  import Check from "phosphor-svelte/lib/CheckIcon";
  import Globe from "phosphor-svelte/lib/GlobeIcon";
  import MagnifyingGlass from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import Sparkle from "phosphor-svelte/lib/SparkleIcon";
  import { untrack, type Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import Collapsible from "../collapsible/Collapsible.svelte";
  import Shimmer from "../shimmer/Shimmer.svelte";
  import Spinner from "../spinner/Spinner.svelte";
  import { thinkingState } from "./thinking-state.recipe";

  export type ThinkingRow = {
    primary: string;
    secondary?: string;
    mono?: boolean;
    add?: number;
    del?: number;
    href?: string;
  };
  export type ThinkingVariant = "steps" | "reasoning" | "search" | "coding";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    variant?: ThinkingVariant;
    working?: boolean;
    /** Two-way bindable: <ThinkingState bind:expanded /> */
    expanded?: boolean;
    ontoggle?: (expanded: boolean) => void;
    activeLabel?: string;
    doneLabel?: string;
    rows?: ThinkingRow[];
    /** search variant: the query shown above the sources */
    query?: string;
    /** search variant: trailer such as "+7 more" */
    more?: string;
    /** Rows are buttons with aria-pressed; defaults on for coding, or when onrowclick is given. */
    pressable?: boolean;
    /** Two-way bindable: index of the pressed row, or null. */
    selected?: number | null;
    /** Replace the sparkle. */
    icon?: Snippet;
    onrowclick?: (row: ThinkingRow, index: number) => void;
    /** Enter on mount: the rows present at mount fade up, staggered. Off by default; set it on the trace your code adds live, never on one rendered from history or with the page. Rows added later enter either way. */
    appear?: boolean;
  };

  let {
    variant = "steps", working = false, expanded = $bindable(false), ontoggle,
    activeLabel = "Thinking", doneLabel = "Done thinking", rows = [], query, more, pressable,
    selected = $bindable(null), icon, onrowclick, appear = false, class: className, ...rest
  }: Props = $props();

  const isPressable = $derived(pressable ?? (variant === "coding" || Boolean(onrowclick)));
  const TONES = ["accent", "orange", "green"] as const;

  /* rows present at first render stagger in; a row that arrives later enters at once */
  const initial = untrack(() => rows.length);
  /* without appear, what is here at mount is simply there; what is added later enters */
  const atMount = untrack(() => ({ appear, query: Boolean(query), more: Boolean(more) }));
  const stagger = (i: number) => (i < initial ? `--fndn-row-index:${i}` : undefined);

  /* status swaps animate, first paint does not: the ready variant arms the entry transitions */
  let ready = $state(false);
  const r = $derived(thinkingState({ variant, working, ready }));

  /* rail: grow to meet a row that arrives; any other size change (wrapping, fonts) is instant */
  let list = $state<HTMLElement | null>(null);
  let line = $state<HTMLElement | null>(null);
  $effect(() => {
    ready = true;
    const rowsEl = list, lineEl = line;
    if (!rowsEl || !lineEl) return;
    let lastCount = -1;
    const measure = () => {
      const count = rowsEl.childElementCount;
      const grow = lastCount !== -1 && count !== lastCount;
      if (!grow) lineEl.style.transition = "none";
      lineEl.style.height = `${rowsEl.offsetHeight + 2}px`;
      lineEl.setAttribute("data-measured", "");
      if (!grow) { void lineEl.offsetHeight; lineEl.style.transition = ""; }
      lastCount = count;
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(rowsEl);
    return () => observer.disconnect();
  });

  function toggle(next: boolean) {
    expanded = next;
    ontoggle?.(next);
  }
  function press(row: ThinkingRow, i: number) {
    selected = selected === i ? null : i;
    onrowclick?.(row, i);
  }
</script>

{#snippet rowContent(row: ThinkingRow, i: number)}
  {#if variant === "steps"}
    <span data-slot="thinking-state-check" class={r.check()} aria-hidden="true">
      {#if working && i === rows.length - 1}
        <Spinner size="sm" decorative />
      {:else}
        <Check data-slot="icon" weight="bold" aria-hidden="true" />
      {/if}
    </span>
  {/if}
  {#if variant === "search"}
    <span data-slot="thinking-state-dot" class={r.dot({ tone: TONES[i % 3] })} aria-hidden="true">
      <Globe data-slot="icon" weight="bold" aria-hidden="true" />
    </span>
  {/if}
  <span data-slot="thinking-state-primary" class={r.primary()} title={variant !== "reasoning" ? row.primary : undefined}>{row.primary}</span>
  {#if row.secondary}<span data-slot="thinking-state-secondary" class={r.secondary({ mono: !!row.mono })} title={row.secondary}>{row.secondary}</span>{/if}
  {#if row.add !== undefined || row.del !== undefined}
    <span data-slot="thinking-state-diff" class={r.diff()}>
      {#if row.add !== undefined}<span data-add="">+{row.add}</span>{/if}
      {#if row.del !== undefined}<span data-del="">−{row.del}</span>{/if}
    </span>
  {/if}
{/snippet}

<div data-slot="thinking-state" class={r.base({ class: className as string | undefined })} {...rest}>
  {#snippet header()}
    <span data-slot="thinking-state-icon" class={r.icon()} aria-hidden="true">
      {#if icon}
        {@render icon()}
      {:else}
        <Sparkle data-slot="icon" weight="fill" aria-hidden="true" />
      {/if}
    </span>
    <span data-slot="thinking-state-label" class={r.label()} role="status">
      {#if working}
        <Shimmer data-thinking-state="label-text" speed="fast" class={r.labelText()} title={activeLabel}>{activeLabel}</Shimmer>
      {:else}
        <span data-slot="thinking-state-label-text" class={r.labelText()} title={doneLabel}>{doneLabel}</span>
      {/if}
    </span>
  {/snippet}
  <Collapsible variant="inline" caret="start" keepLayout labelClass={r.header()} open={expanded} onopenchange={toggle} label={header}>
      <div data-slot="thinking-state-rail" class={r.rail()}>
        <span bind:this={line} data-slot="thinking-state-line" class={r.line()} aria-hidden="true"></span>
        <div bind:this={list} data-slot="thinking-state-rows" class={r.rows()}>
          {#if variant === "search" && query}
            <div data-slot="thinking-state-query" class={r.query({ appear: atMount.appear || !atMount.query })}>
              <MagnifyingGlass data-slot="icon" weight="bold" aria-hidden="true" />
              <span>{query}</span>
            </div>
          {/if}
          {#each rows as row, i (i)}
            {#if row.href}
              <a data-slot="thinking-state-row" class={r.row({ appear: atMount.appear || i >= initial })} href={row.href} target="_blank" rel="noreferrer" style={stagger(i)}>{@render rowContent(row, i)}</a>
            {:else if isPressable}
              <button type="button" data-slot="thinking-state-row" class={r.row({ appear: atMount.appear || i >= initial })} aria-pressed={selected === i} style={stagger(i)} onclick={() => press(row, i)}>{@render rowContent(row, i)}</button>
            {:else}
              <div data-slot="thinking-state-row" class={r.row({ appear: atMount.appear || i >= initial })} style={stagger(i)}>{@render rowContent(row, i)}</div>
            {/if}
          {/each}
          {#if variant === "search" && more}<span data-slot="thinking-state-more" class={r.more({ appear: atMount.appear || !atMount.more })} style="--fndn-row-index:{initial}">{more}</span>{/if}
        </div>
      </div>
  </Collapsible>
</div>
