/* Insight chart — the framework-neutral chart builder behind insight-cards.
 *
 * One function turns a chart description (JSON) into a list of SVG shapes; every target renders
 * that list as it is (React/Vue/Svelte through their templates),
 * so the three targets draw the same chart, attribute for attribute. No charting dependency.
 * Charts are functional data: they never animate, on mount or on page change.
 *
 * Kinds: "line" (one or more series over time), "bar" (one series, optional threshold rule),
 * "share" (one value per series, drawn as a stacked bar of their shares). */

export type InsightTone = "accent" | "orange" | "red" | "green" | "neutral";
export type InsightFormat = "number" | "percent" | "money";
export type InsightSeries = { name: string; values: number[]; tone?: InsightTone };
export type InsightChart = {
  kind: "line" | "bar" | "share";
  series: InsightSeries[];
  /** How values read in the legend and the text alternative. Default "number". */
  format?: InsightFormat;
  /** A dashed rule across the plot (bar and line charts), e.g. a spend threshold. */
  threshold?: number;
  /** Text alternative; generated from the data when omitted. */
  label?: string;
};
export type ChartShape = {
  tag: "path" | "rect" | "line";
  /** the recipe slot: data-slot="insight-cards-<part>" */
  part: "line" | "bar" | "segment" | "rule";
  attrs: Record<string, string>;
  /** the recipe variant it takes: a series' tone, or a rule's kind */
  variant: { tone?: InsightTone; rule?: "zero" | "threshold" };
};
export type LegendEntry = { name: string; tone: InsightTone; value: string };

/** The plot is drawn in this box and stretched to the chart's CSS size (strokes do not scale). */
export const CHART_W = 300;
export const CHART_H = 120;
export const SHARE_H = 12;
const PAD = 8;

const n2 = (v: number) => String(Math.round(v * 100) / 100);
const finite = (values: number[]) => values.filter((v) => Number.isFinite(v));
const toneOf = (s: InsightSeries): InsightTone => s.tone ?? "accent";

const grouped = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
/** Values as they read in the legend: +1.15% · -$2,377.66 · 12,480. */
export function formatValue(v: number, format: InsightFormat = "number"): string {
  if (!Number.isFinite(v)) return "–";
  if (format === "percent") return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
  if (format === "money") return `${v < 0 ? "-" : ""}$${grouped.format(Math.abs(v))}`;
  return grouped.format(v);
}
const sharePct = (v: number, total: number) => `${total > 0 ? (Math.round((v / total) * 1000) / 10).toString() : "0"}%`;

/** The SVG box and shapes for one chart. */
export function chartShapes(chart: InsightChart): { viewBox: string; shapes: ChartShape[] } {
  const series = chart.series ?? [];
  if (chart.kind === "share") {
    const values = series.map((s) => Math.max(0, finite(s.values)[0] ?? 0));
    const total = values.reduce((a, b) => a + b, 0);
    const shown = values.filter((v) => v > 0).length;
    const gap = 2;
    const room = CHART_W - gap * Math.max(0, shown - 1);
    const shapes: ChartShape[] = [];
    let x = 0;
    series.forEach((s, i) => {
      const v = values[i]!;
      if (!(v > 0) || total <= 0) return;
      const w = (v / total) * room;
      shapes.push({ tag: "rect", part: "segment", attrs: { x: n2(x), y: "0", width: n2(Math.max(w, 1)), height: String(SHARE_H), rx: "2" }, variant: { tone: toneOf(s) } });
      x += w + gap;
    });
    return { viewBox: `0 0 ${CHART_W} ${SHARE_H}`, shapes };
  }

  const all = finite(series.flatMap((s) => s.values ?? []));
  const viewBox = `0 0 ${CHART_W} ${CHART_H}`;
  if (!all.length) return { viewBox, shapes: [] };
  const extra = chart.threshold != null && Number.isFinite(chart.threshold) ? [chart.threshold] : [];
  let lo = Math.min(...all, ...extra);
  let hi = Math.max(...all, ...extra);
  if (chart.kind === "bar") { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  if (hi === lo) { hi += 1; lo -= 1; }
  const y = (v: number) => PAD + ((hi - v) / (hi - lo)) * (CHART_H - PAD * 2);
  const shapes: ChartShape[] = [];
  const rule = (v: number, kind: "zero" | "threshold") =>
    shapes.push({ tag: "line", part: "rule", attrs: { x1: "0", x2: String(CHART_W), y1: n2(y(v)), y2: n2(y(v)) }, variant: { rule: kind } });

  if (chart.kind === "bar") {
    const s = series[0];
    const values = s ? s.values ?? [] : [];
    const slot = CHART_W / Math.max(values.length, 1);
    const width = Math.min(slot * 0.62, 28);
    values.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      const top = Math.min(y(v), y(0));
      const height = Math.max(Math.abs(y(v) - y(0)), 1);
      shapes.push({ tag: "rect", part: "bar", attrs: { x: n2(i * slot + (slot - width) / 2), y: n2(top), width: n2(width), height: n2(height) }, variant: { tone: toneOf(s!) } });
    });
    rule(0, "zero");
  } else {
    if (lo < 0 && hi > 0) rule(0, "zero");
    for (const s of series) {
      const values = s.values ?? [];
      const points = values.map((v, i) => [values.length === 1 ? 0 : (i / (values.length - 1)) * CHART_W, v] as const).filter(([, v]) => Number.isFinite(v));
      if (!points.length) continue;
      /* a single value has no slope: draw it as a level line across the plot */
      const d = points.length === 1
        ? `M0 ${n2(y(points[0]![1]))}H${CHART_W}`
        : points.map(([x, v], i) => `${i ? "L" : "M"}${n2(x)} ${n2(y(v))}`).join("");
      shapes.push({ tag: "path", part: "line", attrs: { d }, variant: { tone: toneOf(s) } });
    }
  }
  if (extra.length) rule(extra[0]!, "threshold");
  return { viewBox, shapes };
}

/** Legend rows: each series with its latest value (or its share). */
export function chartLegend(chart: InsightChart): LegendEntry[] {
  const series = chart.series ?? [];
  if (chart.kind === "share") {
    const values = series.map((s) => Math.max(0, finite(s.values)[0] ?? 0));
    const total = values.reduce((a, b) => a + b, 0);
    return series.map((s, i) => ({ name: s.name, tone: toneOf(s), value: sharePct(values[i]!, total) }));
  }
  return series.map((s) => {
    const values = finite(s.values ?? []);
    return { name: s.name, tone: toneOf(s), value: values.length ? formatValue(values[values.length - 1]!, chart.format) : "–" };
  });
}

/** The chart's text alternative: what a sighted reader takes from it, in one or two sentences. */
export function chartLabel(chart: InsightChart): string {
  if (chart.label) return chart.label;
  const series = chart.series ?? [];
  const f = (v: number) => formatValue(v, chart.format);
  if (chart.kind === "share") {
    const legend = chartLegend(chart);
    return legend.length ? `Share chart. ${legend.map((l) => `${l.name} ${l.value}`).join(", ")}.` : "Share chart with no data.";
  }
  const parts = series.map((s) => {
    const values = finite(s.values ?? []);
    if (!values.length) return `${s.name}: no data`;
    if (values.length === 1) return `${s.name}: ${f(values[0]!)}`;
    return `${s.name}: ${f(values[0]!)} to ${f(values[values.length - 1]!)}, low ${f(Math.min(...values))}, high ${f(Math.max(...values))}`;
  });
  const count = Math.max(0, ...series.map((s) => (s.values ?? []).length));
  const head = chart.kind === "bar" ? `Bar chart, ${count} ${count === 1 ? "bar" : "bars"}` : `Line chart, ${count} ${count === 1 ? "point" : "points"}`;
  const threshold = chart.threshold != null && Number.isFinite(chart.threshold) ? ` Threshold ${f(chart.threshold)}.` : "";
  return parts.length ? `${head}. ${parts.join(". ")}.${threshold}` : `${head} with no data.`;
}

/** First grapheme of a name, upper-cased, for an entity chip's monogram ("élan" → "É"). */
export function monogram(name: string): string {
  const text = name.trim();
  if (!text) return "";
  const first =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)[Symbol.iterator]().next().value?.segment
      : Array.from(text)[0];
  return (first ?? "").toLocaleUpperCase();
}
