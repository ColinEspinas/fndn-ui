"use client";
import { useState, type HTMLAttributes } from "react";
import { Button } from "../button/button";
import { Count } from "../count/count";
import { EmptyState } from "../empty-state/empty-state";
import { EntityChip } from "../entity-chip/entity-chip";
import { insightCards } from "./insight-cards.recipe";
import { Pager } from "../pager/pager";
import { ValuePill } from "../value-pill/value-pill";
import { chartLabel, chartLegend, chartShapes, monogram, type InsightChart } from "./insight-chart";

export type { InsightChart, InsightSeries, InsightTone, InsightFormat } from "./insight-chart";
export type InsightValueTone = "neutral" | "green" | "orange" | "red" | "accent";
/** A piece of an insight's sentence: text, an entity chip or a value pill. */
export type InsightSegment = string | { entity: string; color?: string } | { value: string; tone?: InsightValueTone };
export type Insight = {
  id: string;
  /** Card heading and the page's accessible name. */
  title: string;
  summary: string | InsightSegment[];
  chart?: InsightChart;
  /** Follow-up prompt shown under the card. */
  action?: string;
};

export type InsightCardsProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  insights: ReadonlyArray<Insight>;
  /** Controlled page index. Omit for uncontrolled (use defaultPage). */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  /** The follow-up button of an insight was pressed. */
  onAction?: (id: string) => void;
  title?: string;
  emptyText?: string;
};

function Segment({ segment }: { segment: InsightSegment }) {
  if (typeof segment === "string") return <>{segment}</>;
  if ("entity" in segment) return <EntityChip name={segment.entity} color={segment.color} monogram={monogram(segment.entity)} />;
  return <ValuePill tone={segment.tone ?? "neutral"}>{segment.value}</ValuePill>;
}

function Chart({ chart, r }: { chart: InsightChart; r: ReturnType<typeof insightCards> }) {
  const { viewBox, shapes } = chartShapes(chart);
  return (
    <svg data-slot="insight-cards-chart" className={r.chart({ kind: chart.kind })} role="img" aria-label={chartLabel(chart)} viewBox={viewBox} preserveAspectRatio="none">
      {shapes.map((shape, i) => {
        const Tag = shape.tag;
        return <Tag key={i} data-slot={`insight-cards-${shape.part}`} className={r[shape.part](shape.variant)} {...shape.attrs} />;
      })}
    </svg>
  );
}

/** Paged insights with an inline SVG chart. */
export function InsightCards({
  insights, page, defaultPage = 0, onPageChange, onAction, title = "Insights", emptyText = "No insights yet.", className, ...rest
}: InsightCardsProps) {
  const [inner, setInner] = useState(defaultPage);
  const r = insightCards();
  const count = insights.length;
  const current = Math.min(Math.max(page ?? inner, 0), Math.max(count - 1, 0));
  const go = (to: number) => {
    if (to === current) return;
    if (page === undefined) setInner(to);
    onPageChange?.(to);
  };

  return (
    <section data-slot="insight-cards" className={r.base({ class: className })} aria-roledescription="carousel" aria-label={title} {...rest}>
      <div data-slot="insight-cards-header" className={r.header()}>
        <span data-slot="insight-cards-title" className={r.title()}>{title}<Count variant="plain">{count}</Count></span>
        <Pager count={count} page={current} onPageChange={go} loop layout="start" label="Choose insight" prevLabel="Previous insight" nextLabel="Next insight" />
      </div>
      {count === 0 ? (
        <EmptyState title={emptyText} size="row" align="center" />
      ) : (
        <div data-slot="insight-cards-pages" className={r.pages()}>
          {insights.map((insight, i) => (
            <article key={insight.id} data-slot="insight-cards-page" className={r.page({ active: i === current })} role="group" aria-roledescription="slide" aria-label={insight.title}>
              <p data-slot="insight-cards-summary" className={r.summary()}>
                {typeof insight.summary === "string" ? insight.summary : insight.summary.map((s, k) => <Segment key={k} segment={s} />)}
              </p>
              <div data-slot="insight-cards-card" className={r.card()}>
                <span data-slot="insight-cards-card-title" className={r.cardTitle()}>{insight.title}</span>
                {insight.chart && (
                  <>
                    <ul data-slot="insight-cards-legend" className={r.legend()}>
                      {chartLegend(insight.chart).map((entry, k) => (
                        <li key={k} data-slot="insight-cards-legend-item" className={r.legendItem()}>
                          <span data-slot="insight-cards-legend-name" className={r.legendName()} title={entry.name}>
                            <span data-slot="insight-cards-swatch" className={r.swatch({ tone: entry.tone })} aria-hidden />
                            <span data-slot="insight-cards-legend-label" className={r.legendLabel()}>{entry.name}</span>
                          </span>
                          <span data-slot="insight-cards-legend-value" className={r.legendValue()}>{entry.value}</span>
                        </li>
                      ))}
                    </ul>
                    <Chart chart={insight.chart} r={r} />
                  </>
                )}
              </div>
              {insight.action && (
                <Button data-insight-cards="action" className={r.action()} variant="outline" size="sm" onClick={() => onAction?.(insight.id)}>
                  {insight.action}
                </Button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
