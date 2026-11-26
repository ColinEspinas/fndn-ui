<script setup lang="ts">
/** Paged insights with an inline SVG chart. */
import { computed, useAttrs } from "vue";
import Button from "../button/Button.vue";
import Count from "../count/Count.vue";
import EmptyState from "../empty-state/EmptyState.vue";
import EntityChip from "../entity-chip/EntityChip.vue";
import { insightCards } from "./insight-cards.recipe";
import Pager from "../pager/Pager.vue";
import ValuePill from "../value-pill/ValuePill.vue";
import { chartLabel, chartLegend, chartShapes, monogram, type InsightChart } from "./insight-chart";

export type InsightValueTone = "neutral" | "green" | "orange" | "red" | "accent";
/** A piece of an insight's sentence: text, an entity chip or a value pill. */
export type InsightSegment = string | { entity: string; color?: string } | { value: string; tone?: InsightValueTone };
export type Insight = { id: string; title: string; summary: string | InsightSegment[]; chart?: InsightChart; action?: string };

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const r = insightCards();

const props = withDefaults(
  defineProps<{
    insights: ReadonlyArray<Insight>;
    title?: string;
    emptyText?: string;
  }>(),
  { title: "Insights", emptyText: "No insights yet." },
);

/** v-model:page — falls back to local state when unbound. */
const page = defineModel<number>("page", { default: 0 });
const emit = defineEmits<{ pageChange: [page: number]; action: [id: string] }>();

const count = computed(() => props.insights.length);
const current = computed(() => Math.min(Math.max(page.value ?? 0, 0), Math.max(count.value - 1, 0)));
const charts = computed(() =>
  props.insights.map((insight) => (insight.chart ? { ...chartShapes(insight.chart), label: chartLabel(insight.chart), legend: chartLegend(insight.chart) } : null)),
);
const isEntity = (s: InsightSegment): s is { entity: string; color?: string } => typeof s !== "string" && "entity" in s;
const segments = (summary: Insight["summary"]): InsightSegment[] => (typeof summary === "string" ? [summary] : summary);

function go(to: number) {
  if (to === current.value) return;
  page.value = to;
  emit("pageChange", to);
}
</script>

<template>
  <section v-bind="attrs" data-slot="insight-cards" :class="r.base({ class: attrs.class as string | undefined })" aria-roledescription="carousel" :aria-label="title">
    <div data-slot="insight-cards-header" :class="r.header()">
      <span data-slot="insight-cards-title" :class="r.title()">{{ title }}<Count variant="plain">{{ count }}</Count></span>
      <Pager :count="count" :page="current" loop layout="start" label="Choose insight" prev-label="Previous insight" next-label="Next insight" @update:page="go" />
    </div>
    <EmptyState v-if="count === 0" :title="emptyText" size="row" align="center" />
    <div v-else data-slot="insight-cards-pages" :class="r.pages()">
      <article
        v-for="(insight, i) in insights"
        :key="insight.id"
        data-slot="insight-cards-page"
        :class="r.page({ active: i === current })"
        role="group"
        aria-roledescription="slide"
        :aria-label="insight.title"
      >
        <p data-slot="insight-cards-summary" :class="r.summary()"><template v-for="(s, k) in segments(insight.summary)" :key="k"><template v-if="typeof s === 'string'">{{ s }}</template><EntityChip v-else-if="isEntity(s)" :name="s.entity" :color="s.color" :monogram="monogram(s.entity)" /><ValuePill v-else :tone="s.tone ?? 'neutral'">{{ s.value }}</ValuePill></template></p>
        <div data-slot="insight-cards-card" :class="r.card()">
          <span data-slot="insight-cards-card-title" :class="r.cardTitle()">{{ insight.title }}</span>
          <template v-if="insight.chart && charts[i]">
            <ul data-slot="insight-cards-legend" :class="r.legend()">
              <li v-for="(entry, k) in charts[i]!.legend" :key="k" data-slot="insight-cards-legend-item" :class="r.legendItem()">
                <span data-slot="insight-cards-legend-name" :class="r.legendName()" :title="entry.name">
                  <span data-slot="insight-cards-swatch" :class="r.swatch({ tone: entry.tone })" aria-hidden="true" />
                  <span data-slot="insight-cards-legend-label" :class="r.legendLabel()">{{ entry.name }}</span>
                </span>
                <span data-slot="insight-cards-legend-value" :class="r.legendValue()">{{ entry.value }}</span>
              </li>
            </ul>
            <svg data-slot="insight-cards-chart" :class="r.chart({ kind: insight.chart.kind })" role="img" :aria-label="charts[i]!.label" :viewBox="charts[i]!.viewBox" preserveAspectRatio="none">
              <component :is="shape.tag" v-for="(shape, k) in charts[i]!.shapes" :key="k" :data-slot="`insight-cards-${shape.part}`" :class="r[shape.part](shape.variant)" v-bind="shape.attrs" />
            </svg>
          </template>
        </div>
        <Button v-if="insight.action" data-insight-cards="action" :class="r.action()" variant="outline" size="sm" @click="emit('action', insight.id)">{{ insight.action }}</Button>
      </article>
    </div>
  </section>
</template>
