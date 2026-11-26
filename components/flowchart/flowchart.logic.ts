/* Flowchart — the framework-neutral logic behind the flowchart's condition rows.
 *
 * Every target edits the condition list through these functions (add, move, remove, change a
 * property or value), offers the same row actions, and moves focus the same way afterwards. */

export type FlowchartOption = { value: string; label: string; meta?: string };
export type FlowchartTrigger = { value: string; label: string; caption?: string };
export type FlowchartCondition = { id: string; property: string; value: string };
export type FlowchartChoices = Record<string, ReadonlyArray<FlowchartOption>>;
export type RowAction = "up" | "down" | "remove";
export type RowEntry = { value: RowAction; label: string; disabled?: boolean; tone?: "danger" } | { type: "separator" };

/** The fixed strings. {n} is the row's number (1-based). Pass a partial object; the rest stays English. */
export type FlowchartLabels = {
  /** The trigger node's kind pill. */
  trigger: string;
  /** The condition node's kind pill. */
  condition: string;
  /** Accessible name of the condition card. */
  conditions: string;
  /** Joiner of the first row, then of every other row. */
  if: string;
  and: string;
  /** Between a property and its value. */
  is: string;
  addCondition: string;
  /** Names of a row's handle and selects. */
  rowOptions: string;
  rowProperty: string;
  rowValue: string;
  moveUp: string;
  moveDown: string;
  remove: string;
};
export const FLOWCHART_LABELS: FlowchartLabels = {
  trigger: "Trigger",
  condition: "If / Else",
  conditions: "Conditions",
  if: "If",
  and: "and",
  is: "is",
  addCondition: "Add condition",
  rowOptions: "Condition {n} options",
  rowProperty: "Condition {n} property",
  rowValue: "Condition {n} value",
  moveUp: "Move up",
  moveDown: "Move down",
  remove: "Remove",
};
export const flowchartLabels = (labels?: Partial<FlowchartLabels>): FlowchartLabels => ({ ...FLOWCHART_LABELS, ...labels });
const numbered = (template: string, index: number) => template.replace(/\{n\}/g, String(index + 1));

/** The actions of the row at `index` of `count`: reordering without dragging, and removal. */
export function rowActions(index: number, count: number, t: FlowchartLabels = FLOWCHART_LABELS): RowEntry[] {
  return [
    { value: "up", label: t.moveUp, disabled: index === 0 },
    { value: "down", label: t.moveDown, disabled: index >= count - 1 },
    { type: "separator" },
    { value: "remove", label: t.remove, tone: "danger" },
  ];
}

export const joinerOf = (index: number, t: FlowchartLabels = FLOWCHART_LABELS) => (index === 0 ? t.if : t.and);
export const handleLabel = (index: number, t: FlowchartLabels = FLOWCHART_LABELS) => numbered(t.rowOptions, index);
export const propertyLabel = (index: number, t: FlowchartLabels = FLOWCHART_LABELS) => numbered(t.rowProperty, index);
export const valueLabel = (index: number, t: FlowchartLabels = FLOWCHART_LABELS) => numbered(t.rowValue, index);
export const choicesOf = (choices: FlowchartChoices, property: string): ReadonlyArray<FlowchartOption> => choices[property] ?? [];
export const labelOf = (options: ReadonlyArray<FlowchartOption | FlowchartTrigger>, value: string) => options.find((o) => o.value === value)?.label ?? "";

/** What moves where after a row action, and what takes focus once the list has re-rendered. */
export type Focus = { index: number; part: "handle" | "property" } | { part: "add" };
export function applyRowAction(list: ReadonlyArray<FlowchartCondition>, index: number, action: RowAction): { next: FlowchartCondition[]; focus: Focus } {
  const next = list.slice();
  if (action === "remove") {
    next.splice(index, 1);
    return { next, focus: next.length ? { index: Math.min(index, next.length - 1), part: "handle" } : { part: "add" } };
  }
  const to = action === "up" ? index - 1 : index + 1;
  if (to < 0 || to >= next.length) return { next, focus: { index, part: "handle" } };
  const [row] = next.splice(index, 1);
  next.splice(to, 0, row!);
  return { next, focus: { index: to, part: "handle" } };
}

/** A new condition on the first property and its first value, with an id no row uses yet. */
export function addCondition(list: ReadonlyArray<FlowchartCondition>, properties: ReadonlyArray<FlowchartOption>, choices: FlowchartChoices): { next: FlowchartCondition[]; focus: Focus } {
  const property = properties[0]?.value ?? "";
  const used = new Set(list.map((c) => c.id));
  let n = list.length + 1;
  while (used.has(`c${n}`)) n++;
  const next = [...list, { id: `c${n}`, property, value: choicesOf(choices, property)[0]?.value ?? "" }];
  return { next, focus: { index: next.length - 1, part: "property" } };
}

/** A new property resets the value to the property's first choice. */
export function setProperty(list: ReadonlyArray<FlowchartCondition>, index: number, property: string, choices: FlowchartChoices): FlowchartCondition[] {
  return list.map((c, i) => (i === index ? { ...c, property, value: choicesOf(choices, property)[0]?.value ?? "" } : c));
}
export function setValue(list: ReadonlyArray<FlowchartCondition>, index: number, value: string): FlowchartCondition[] {
  return list.map((c, i) => (i === index ? { ...c, value } : c));
}

/* ── DOM helpers, shared by every target ─────────────────────────── */

/** Move focus once the list has re-rendered and the menu has handed focus back to its trigger. */
export function focusAfter(root: HTMLElement, focus: Focus): void {
  const run = () => {
    const target =
      focus.part === "add"
        ? root.querySelector<HTMLElement>("[data-flowchart=add]")
        : root.querySelectorAll<HTMLElement>("[data-slot=flowchart-row]")[focus.index]?.querySelector<HTMLElement>(focus.part === "handle" ? "[data-slot=flowchart-handle]" : "[data-slot=select-trigger]");
    target?.focus({ preventScroll: false });
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
}

/** Reveal a row the user just added, once. Keyboard adds are instant (`docs motion`). */
export function revealRow(root: HTMLElement, index: number): void {
  if (typeof document === "undefined" || document.documentElement.dataset.fndnInput === "keyboard") return;
  const row = root.querySelectorAll<HTMLElement>("[data-slot=flowchart-row]")[index];
  if (!row) return;
  row.setAttribute("data-entering", "");
  /* the row makes its room as it fades up: one frame at minmax(0,0fr), then its track opens to minmax(0,1fr)
   * (so the card grows with it instead of snapping 32px) */
  row.setAttribute("data-collapsed", "");
  void row.offsetHeight;
  row.removeAttribute("data-collapsed");
  /* the attribute goes once the entrance ends, so a later reorder (a DOM move) cannot replay it */
  const done = () => row.removeAttribute("data-entering");
  row.addEventListener("animationend", done, { once: true });
  setTimeout(done, 1000);
}
