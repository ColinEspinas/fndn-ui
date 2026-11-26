/* diff-table — framework-neutral pieces shared by the React, Vue and Svelte adapters. */

export type DiffTableLabels = {
  hint: string;
  /** Accessible name prefix of a removal's include box: "Remove Starter plan". */
  remove: string;
  /** Accessible name prefix of an addition's include box: "Add Team plan". */
  add: string;
  apply: string;
  removal: string;
  removals: string;
  addition: string;
  additions: string;
  edit: string;
  edits: string;
  applied: string;
  change: string;
  changes: string;
  /** Shown in the body when there are no rows. */
  empty: string;
};

export const DIFF_TABLE_LABELS: DiffTableLabels = {
  hint: "Click changed rows to toggle", remove: "Remove", add: "Add", apply: "Apply",
  removal: "removal", removals: "removals", addition: "addition", additions: "additions",
  edit: "edit", edits: "edits", applied: "applied", change: "change", changes: "changes",
  empty: "No changes proposed",
};

export function diffTableText(t: DiffTableLabels, removals: number, additions: number) {
  const total = removals + additions;
  return {
    total,
    summary: `${removals} ${removals === 1 ? t.removal : t.removals} · ${additions} ${additions === 1 ? t.addition : t.additions}`,
    apply: `${t.apply} ${total} ${total === 1 ? t.change : t.changes}`,
    applied: `${total} ${total === 1 ? t.edit : t.edits} ${t.applied}`,
  };
}

/** The focusable part of an include box: the checkbox's native input. */
export const DIFF_TABLE_BOX = "[data-slot=checkbox-input]";

/** Keys on an include box (the checkbox's input). Enter / Space toggle (Space is taken from the
 * native checkbox so both keys go through `toggle`); ArrowUp / ArrowDown move to the previous / next
 * changed row, Home / End to the first / last. Returns true when the key was handled. */
export function diffTableKey(event: KeyboardEvent, mark: HTMLElement, toggle: () => void): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey) return false;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggle();
    return true;
  }
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return false;
  const table = mark.closest("[data-slot=diff-table-table]");
  if (!table) return false;
  const marks = Array.from(table.querySelectorAll<HTMLInputElement>(`${DIFF_TABLE_BOX}:not(:disabled)`));
  const i = marks.indexOf(mark as HTMLInputElement);
  const next = event.key === "ArrowDown" ? marks[i + 1] : event.key === "ArrowUp" ? marks[i - 1] : event.key === "Home" ? marks[0] : marks[marks.length - 1];
  event.preventDefault();
  next?.focus();
  return true;
}

/** A click anywhere on a changed row moves focus to its include box (without a ring), so the
 * arrow keys carry on from there. */
export function focusRowMark(row: HTMLElement): void {
  const mark = row.querySelector<HTMLElement>(DIFF_TABLE_BOX);
  if (mark && document.activeElement !== mark) mark.focus({ preventScroll: true });
}

/** A click on a changed row toggles it, unless it landed on the include box itself (the checkbox
 * toggles then, and its label also forwards the click to the input). */
export const isBoxClick = (event: Event) => !!(event.target as Element | null)?.closest?.("[data-slot=checkbox]");
