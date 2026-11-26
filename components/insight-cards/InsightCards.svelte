<!-- Paged insights with an inline SVG chart. -->
<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import Button from "../button/Button.svelte";
  import Count from "../count/Count.svelte";
  import EmptyState from "../empty-state/EmptyState.svelte";
  import EntityChip from "../entity-chip/EntityChip.svelte";
  import { insightCards } from "./insight-cards.recipe";
  import Pager from "../pager/Pager.svelte";
  import ValuePill from "../value-pill/ValuePill.svelte";
  import { chartLabel, chartLegend, chartShapes, monogram, type InsightChart } from "./insight-chart";

  export type InsightValueTone = "neutral" | "green" | "orange" | "red" | "accent";
  /** A piece of an insight's sentence: text, an entity chip or a value pill. */
  export type InsightSegment = string | { entity: string; color?: string } | { value: string; tone?: InsightValueTone };
  export type Insight = { id: string; title: string; summary: string | InsightSegment[]; chart?: InsightChart; action?: string };

  type Props = Omit<HTMLAttributes<HTMLElement>, "title"> & {
    insights: ReadonlyArray<Insight>;
    /** Two-way bindable: <InsightCards bind:page /> */
    page?: number;
    onpagechange?: (page: number) => void;
    /** The follow-up button of an insight was pressed. */
    onaction?: (id: string) => void;
    title?: string;
    emptyText?: string;
  };

  let {
    insights, page = $bindable(0), onpagechange, onaction, title = "Insights", emptyText = "No insights yet.", class: className, ...rest
  }: Props = $props();

  const r = insightCards();
  const count = $derived(insights.length);
  const current = $derived(Math.min(Math.max(page ?? 0, 0), Math.max(count - 1, 0)));
  const charts = $derived(
    insights.map((insight) => (insight.chart ? { ...chartShapes(insight.chart), label: chartLabel(insight.chart), legend: chartLegend(insight.chart) } : null)),
  );
  const segments = (summary: Insight["summary"]): InsightSegment[] => (typeof summary === "string" ? [summary] : summary);

  function go(to: number) {
    if (to === current) return;
    page = to;
    onpagechange?.(to);
  }
</script>

<section data-slot="insight-cards" class={r.base({ class: className as string | undefined })} aria-roledescription="carousel" aria-label={title} {...rest}>
  <div data-slot="insight-cards-header" class={r.header()}>
    <span data-slot="insight-cards-title" class={r.title()}>{title}<Count variant="plain">{count}</Count></span>
    <Pager count={count} page={current} onpagechange={go} loop layout="start" label="Choose insight" prevLabel="Previous insight" nextLabel="Next insight" />
  </div>
  {#if count === 0}
    <EmptyState title={emptyText} size="row" align="center" />
  {:else}
    <div data-slot="insight-cards-pages" class={r.pages()}>
      {#each insights as insight, i (insight.id)}
        {@const chart = charts[i]}
        <article data-slot="insight-cards-page" class={r.page({ active: i === current })} role="group" aria-roledescription="slide" aria-label={insight.title}>
          <p data-slot="insight-cards-summary" class={r.summary()}>{#each segments(insight.summary) as s, k (k)}{#if typeof s === "string"}{s}{:else if "entity" in s}<EntityChip name={s.entity} color={s.color} monogram={monogram(s.entity)} />{:else}<ValuePill tone={s.tone ?? "neutral"}>{s.value}</ValuePill>{/if}{/each}</p>
          <div data-slot="insight-cards-card" class={r.card()}>
            <span data-slot="insight-cards-card-title" class={r.cardTitle()}>{insight.title}</span>
            {#if insight.chart && chart}
              <ul data-slot="insight-cards-legend" class={r.legend()}>
                {#each chart.legend as entry, k (k)}
                  <li data-slot="insight-cards-legend-item" class={r.legendItem()}>
                    <span data-slot="insight-cards-legend-name" class={r.legendName()} title={entry.name}>
                      <span data-slot="insight-cards-swatch" class={r.swatch({ tone: entry.tone })} aria-hidden="true"></span>
                      <span data-slot="insight-cards-legend-label" class={r.legendLabel()}>{entry.name}</span>
                    </span>
                    <span data-slot="insight-cards-legend-value" class={r.legendValue()}>{entry.value}</span>
                  </li>
                {/each}
              </ul>
              <svg data-slot="insight-cards-chart" class={r.chart({ kind: insight.chart.kind })} role="img" aria-label={chart.label} viewBox={chart.viewBox} preserveAspectRatio="none">
                {#each chart.shapes as shape, k (k)}
                  <svelte:element this={shape.tag} data-slot={`insight-cards-${shape.part}`} class={r[shape.part](shape.variant)} {...shape.attrs} />
                {/each}
              </svg>
            {/if}
          </div>
          {#if insight.action}
            <Button data-insight-cards="action" class={r.action()} variant="outline" size="sm" onclick={() => onaction?.(insight.id)}>{insight.action}</Button>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</section>
