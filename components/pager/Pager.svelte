<!-- Previous · position · next. -->
<script lang="ts">
  import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
  import CaretLeft from "phosphor-svelte/lib/CaretLeftIcon";
  import CaretRight from "phosphor-svelte/lib/CaretRightIcon";
  import CaretUp from "phosphor-svelte/lib/CaretUpIcon";
  import { REEL, clampPage, pageAfter, pagerDigits, pagerEnds, pagerKey, pagerPosition, pagerSpoken, pagerTotal, type PagerAction } from "./pager.logic";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import Button from "../button/Button.svelte";
  import { pager, type PagerRecipeProps } from "./pager.recipe";
  type PagerDigit = NonNullable<PagerRecipeProps["digit"]>;
  import { mergeProps } from "@ark-ui/svelte/utils";
  import { trackModality } from "../lib/modality";

  type Props = {
    /** Two-way bindable, 0-based: <Pager bind:page /> */
    page?: number;
    onpagechange?: (page: number) => void;
    /** Number of pages. */
    count: number;
    /** Wrap from the last page to the first and back; the buttons never disable. */
    loop?: boolean;
    /** Roll each digit of the position like a counter. */
    reel?: boolean;
    /** between: prev · position · next. start: position · prev · next. */
    layout?: "between" | "start";
    /** horizontal: left/right carets (mirrored right-to-left). vertical: up/down carets, Up/Down keys too. */
    orientation?: "horizontal" | "vertical";
    /** Visible: "of" ("2 of 3") or "/" ("2 / 3"). */
    separator?: string;
    /** What screen readers hear between page and count ("of"), whatever the visible separator. */
    spokenSeparator?: string;
    /** Read before the position by screen readers: "Question" → "Question 2 of 3". */
    unit?: string;
    /** The group's accessible name. */
    label?: string;
    prevLabel?: string;
    nextLabel?: string;
    /** Attributes for the previous button (a host ties it to what it pages: aria-controls). */
    prevProps?: Record<string, string | undefined>;
    /** Attributes for the next button. */
    nextProps?: Record<string, string | undefined>;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    page = $bindable(0), onpagechange, count, loop = false, reel = false, layout = "between", orientation = "horizontal",
    separator = "of", spokenSeparator = "of", unit, label = "Pages", prevLabel = "Previous", nextLabel = "Next", prevProps, nextProps, class: className, style, ...data
  }: Props = $props();

  let root = $state<HTMLElement | null>(null);
  const current = $derived(clampPage(page, count));
  const r = $derived(pager({ layout, orientation }));
  const vertical = $derived(orientation === "vertical");
  const ends = $derived(pagerEnds(current, count, loop));
  const text = $derived(pagerPosition(current, count, separator));
  const spoken = $derived(pagerSpoken(current, count, spokenSeparator, unit));

  function go(action: PagerAction) {
    const to = pageAfter(action, current, count, loop);
    if (to === current) return;
    page = to;
    onpagechange?.(to);
  }
  function onkeydown(e: KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const rtl = root ? getComputedStyle(root).direction === "rtl" : false;
    const action = pagerKey(e.key, rtl, vertical);
    if (!action || count <= 1) return;
    e.preventDefault();
    go(action);
  }
  $effect(() => trackModality());
</script>

<!-- keys page while focus is on either button: the group only listens, it is never focused -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div bind:this={root} {...data} data-slot="pager" class={r.base({ class: className })} {style} role="group" aria-label={label} {onkeydown}>
  {#snippet prevIcon()}{#if vertical}<CaretUp data-slot="icon" weight="bold" />{:else}<CaretLeft data-slot="icon" weight="bold" />{/if}{/snippet}
  {#snippet nextIcon()}{#if vertical}<CaretDown data-slot="icon" weight="bold" />{:else}<CaretRight data-slot="icon" weight="bold" />{/if}{/snippet}
  <Tooltip content={prevLabel}>
    {#snippet trigger(tipProps)}
      <Button {...prevProps} {...mergeProps(tipProps(), { onclick: () => ends.prev && go("prev") })} data-pager="prev" class={r.prev()} variant="ghost" size="sm" square muted icon={prevIcon} aria-label={prevLabel} aria-disabled={ends.prev ? undefined : "true"} />
    {/snippet}
  </Tooltip>
  {#if reel}
    <span data-slot="pager-position" class={r.position()} role="status"><span class="sr-only">{spoken}</span><span data-slot="pager-digits" class={r.digits()} aria-hidden="true">{#each pagerDigits(current, count) as d, i (i)}<span data-slot="pager-digit" class={r.digit()}><span data-slot="pager-reel" class={r.reel({ digit: d as PagerDigit })}>{#each REEL as n (n)}<span>{n}</span>{/each}</span></span>{/each}</span><span data-slot="pager-total" class={r.total()} aria-hidden="true">{pagerTotal(count, separator)}</span></span>
  {:else if spokenSeparator !== separator}
    <span data-slot="pager-position" class={r.position()} role="status"><span class="sr-only">{spoken}</span><span data-slot="pager-text" class={r.text()} aria-hidden="true">{text}</span></span>
  {:else}
    <span data-slot="pager-position" class={r.position()} role="status">{#if unit}<span class="sr-only">{`${unit} `}</span>{/if}{text}</span>
  {/if}
  <Tooltip content={nextLabel}>
    {#snippet trigger(tipProps)}
      <Button {...nextProps} {...mergeProps(tipProps(), { onclick: () => ends.next && go("next") })} data-pager="next" class={r.next()} variant="ghost" size="sm" square muted icon={nextIcon} aria-label={nextLabel} aria-disabled={ends.next ? undefined : "true"} />
    {/snippet}
  </Tooltip>
</div>
