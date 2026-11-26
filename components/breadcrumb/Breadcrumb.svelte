<!-- The trail to the current page. -->
<script lang="ts">
  import CaretRight from "phosphor-svelte/lib/CaretRightIcon";
  import DotsThree from "phosphor-svelte/lib/DotsThreeIcon";
  import Button from "../button/Button.svelte";
  import Menu from "../menu/Menu.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { breadcrumb } from "./breadcrumb.recipe";

  export type BreadcrumbItem = { label: string; href?: string };
  type Entry = { kind: "item"; item: BreadcrumbItem; current: boolean } | { kind: "ellipsis"; hidden: BreadcrumbItem[] };

  type Props = {
    /** The trail from the top level to the current page (the last item). */
    items: ReadonlyArray<BreadcrumbItem>;
    /** Show at most this many items (2 or more): the first, a ⋯ menu, then the last maxItems − 1. */
    maxItems?: number;
    /** The landmark's accessible name. */
    label?: string;
    /** The ⋯ button's name and tooltip. */
    ellipsisLabel?: string;
    /** Replaces the browser's navigation (client routers); a click with a modifier key keeps the browser's. */
    onnavigate?: (href: string | undefined, item: BreadcrumbItem) => void;
    class?: string;
    style?: string;
    /** data-* attributes land on the root (a host marks it as one of its parts). */
    [data: `data-${string}`]: string | undefined;
  };

  let { items, maxItems, label = "Breadcrumb", ellipsisLabel = "Show hidden pages", onnavigate, class: className, style, ...data }: Props = $props();

  const r = breadcrumb();
  const entries = $derived.by((): Entry[] => {
    const n = items.length;
    const keep = maxItems != null && Number.isFinite(maxItems) ? Math.max(2, Math.floor(maxItems)) : n;
    return n > keep
      ? [
          { kind: "item", item: items[0]!, current: false },
          { kind: "ellipsis", hidden: items.slice(1, n - (keep - 1)) },
          ...items.slice(n - (keep - 1)).map((item, i, rest): Entry => ({ kind: "item", item, current: i === rest.length - 1 })),
        ]
      : items.map((item, i) => ({ kind: "item", item, current: i === n - 1 }));
  });

  function follow(item: BreadcrumbItem, e: MouseEvent) {
    if (!onnavigate || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onnavigate(item.href, item);
  }
  function pick(hidden: BreadcrumbItem[], value: string) {
    const item = hidden[Number(value)];
    if (!item) return;
    if (onnavigate) onnavigate(item.href, item);
    else if (item.href) window.location.assign(item.href);
  }
</script>

<nav {...data} data-slot="breadcrumb" aria-label={label} class={r.base({ class: className })} {style}>
  <ol data-slot="breadcrumb-list" class={r.list()}>
    {#each entries as entry, i (i)}
      {#if i > 0}
        <li data-slot="breadcrumb-separator" class={r.separator()} role="presentation" aria-hidden="true">
          <CaretRight data-slot="icon" weight="bold" />
        </li>
      {/if}
      <li data-slot="breadcrumb-item" class={r.item()}>
        {#if entry.kind === "ellipsis"}
          {@const hidden = entry.hidden}
          <Menu items={hidden.map((item, j) => ({ value: String(j), label: item.label }))} onselect={(value) => pick(hidden, value)}>
            {#snippet trigger(menuProps)}
              <Tooltip content={ellipsisLabel} {...menuProps()}>
                {#snippet trigger(tipProps)}
                  <Button {...tipProps()} data-breadcrumb="ellipsis" class={r.ellipsis()} variant="ghost" size="xs" square muted aria-label={ellipsisLabel}>
                    {#snippet icon()}<DotsThree data-slot="icon" weight="bold" />{/snippet}
                  </Button>
                {/snippet}
              </Tooltip>
            {/snippet}
          </Menu>
        {:else if entry.current}
          <span data-slot="breadcrumb-page" class={r.page()} aria-current="page">{entry.item.label}</span>
        {:else if entry.item.href == null}
          <span data-slot="breadcrumb-link" class={r.link()}>{entry.item.label}</span>
        {:else}
          {@const item = entry.item}
          <a data-slot="breadcrumb-link" class={r.link()} href={item.href} onclick={(e) => follow(item, e)}>{item.label}</a>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
