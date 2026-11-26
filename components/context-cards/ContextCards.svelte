<!-- Retrieved knowledge chunks with their sources. -->
<script lang="ts">
  import ArrowUpRight from "phosphor-svelte/lib/ArrowUpRightIcon";
  import TextAlignLeft from "phosphor-svelte/lib/TextAlignLeftIcon";
  import { untrack } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { contextCards } from "./context-cards.recipe";
  import Count from "../count/Count.svelte";

  export type ContextBadgeTone = "neutral" | "red" | "green" | "orange" | "accent";
  export type ContextChunk = { title: string; chars: string; body: string; source: string; href?: string; badge: string; tone?: ContextBadgeTone };
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children" | "title"> & {
    title?: string;
    count?: string;
    chunks: ContextChunk[];
    /** Enter on mount: the header fades in, the cards rise staggered. Off by default; set it on the set your code adds live, never on one rendered from history or with the page. Cards added later enter either way. */
    appear?: boolean;
  };
  let { title = "All chunks", count, chunks, appear = false, class: className, ...rest }: Props = $props();
  /* stagger only the cards that are here at first render (with appear); a card that arrives later enters at once */
  const atMount = untrack(() => chunks.length);
  const entrance = untrack(() => appear);
  const r = contextCards();
</script>

<div data-slot="context-cards" class={r.base({ class: className as string | undefined })} {...rest}>
  <div data-slot="context-cards-header" class={r.header({ appear: entrance })}>
    <span data-slot="context-cards-title" class={r.title()} {title}>{title}</span>
    {#if count !== undefined}<Count variant="boxed">{count}</Count>{/if}
  </div>
  {#each chunks as c, i (`${i}-${c.title}`)}
    <div data-slot="context-cards-card" class={r.card({ appear: entrance || i >= atMount })} style={i < atMount ? `--fndn-row-index:${i}` : undefined}>
      <div data-slot="context-cards-bar" class={r.bar()}>
        <span data-slot="context-cards-card-title" class={r.cardTitle()}>
          <TextAlignLeft data-slot="icon" weight="bold" aria-hidden="true" />
          <span title={c.title}>{c.title}</span>
        </span>
        <span data-slot="context-cards-chars" class={r.chars()}>{c.chars}</span>
      </div>
      <p data-slot="context-cards-body" class={r.body()}>{c.body}</p>
      <div data-slot="context-cards-footer" class={r.footer()}>
        <a data-slot="context-cards-source" class={r.source()} href={c.href ?? "#"} target={c.href ? "_blank" : undefined} rel={c.href ? "noreferrer" : undefined}>
          <span data-slot="context-cards-badge" class={r.badge({ tone: c.tone ?? "neutral" })} aria-hidden="true">{c.badge}</span>
          <span data-slot="context-cards-source-name" class={r.sourceName()} title={c.source}>{c.source}</span>
          <ArrowUpRight data-slot="icon" weight="bold" aria-hidden="true" />
        </a>
      </div>
    </div>
  {/each}
</div>
