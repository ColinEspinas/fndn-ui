/* Framework-neutral logic of the fine-tune card, shared by the React, Vue and Svelte adapters.
 * DOM only. */

/** One scrubbable number property. `value` is its default: the value Reset returns to. */
export type FineTuneField = {
  key: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
};
export type FineTuneLayout = "row" | "col" | "grid";
export type FineTuneLabels = {
  title: string;
  layout: string;
  row: string;
  col: string;
  grid: string;
  type: string;
  placeholder: string;
  adjust: string;
  edited: string;
  reset: string;
};

export const FINE_TUNE_LAYOUTS: readonly FineTuneLayout[] = ["row", "col", "grid"];
/** Phosphor icon of each layout segment. */
export const FINE_TUNE_LAYOUT_ICONS: Record<FineTuneLayout, "columns" | "rows" | "squares-four"> = { row: "columns", col: "rows", grid: "squares-four" };

export const FINE_TUNE_LABELS: FineTuneLabels = {
  title: "Card",
  layout: "Layout",
  row: "Row",
  col: "Column",
  grid: "Grid",
  type: "Type",
  placeholder: "Select type",
  adjust: "Adjust",
  edited: "Edited",
  reset: "Reset",
};

export const FINE_TUNE_FIELDS: FineTuneField[] = [
  { key: "width", label: "W", value: 324, min: 40, max: 999 },
  { key: "height", label: "H", value: 96, min: 24, max: 999 },
  { key: "radius", label: "Radius", value: 28, min: 0, max: 64 },
  { key: "opacity", label: "Opacity", value: 100, min: 0, max: 100, suffix: "%" },
];

export const FINE_TUNE_TYPES = ["Default", "Featured", "Compact"];

export const fineTuneLabels = (labels?: Partial<FineTuneLabels>): FineTuneLabels => ({ ...FINE_TUNE_LABELS, ...labels });

/** The defaults of every field, by key. */
export function fieldDefaults(fields: readonly FineTuneField[]): Record<string, number> {
  return Object.fromEntries(fields.map((f) => [f.key, f.value]));
}

/** The value a field shows: the given one, else its default. */
export const fieldValue = (field: FineTuneField, values: Readonly<Record<string, number>> | undefined): number =>
  values && Number.isFinite(values[field.key]) ? values[field.key]! : field.value;

/** True when anything differs from where the card started: the layout, the type or any field. */
export function isEdited(state: {
  fields: readonly FineTuneField[];
  values: Readonly<Record<string, number>> | undefined;
  layout: string;
  initialLayout: string;
  type: string | null;
  initialType: string | null;
}): boolean {
  return state.layout !== state.initialLayout || state.type !== state.initialType || state.fields.some((f) => fieldValue(f, state.values) !== f.value);
}

/** Page Up / Page Down move a field by its large step (ten steps), clamped. Zag's number input
 * covers the arrows (Shift for ten steps), Home and End; it leaves the page keys to us.
 * Returns the next value, or null when the key is not one of them. */
export function pageStep(event: KeyboardEvent, value: number, field: FineTuneField): number | null {
  if (event.key !== "PageUp" && event.key !== "PageDown") return null;
  event.preventDefault();
  const step = (field.step ?? 1) * 10;
  const next = value + (event.key === "PageUp" ? step : -step);
  return Math.min(field.max, Math.max(field.min, next));
}

/** After Reset the button fades out, so focus moves to the first control of the card (the
 * selected layout segment) instead of falling to the page. */
export function focusAfterReset(root: HTMLElement | null | undefined): void {
  if (!root) return;
  requestAnimationFrame(() => root.querySelector<HTMLInputElement>("[data-slot=segmented-control-input]:checked")?.focus());
}
