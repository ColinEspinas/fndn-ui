"use client";
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { Button } from "../button/button";
import { Checkbox } from "../checkbox/checkbox";
import { diffTable } from "./diff-table.recipe";
import { EmptyState } from "../empty-state/empty-state";
import { StatusPill } from "../status-pill/status-pill";
import { DIFF_TABLE_BOX, DIFF_TABLE_LABELS, diffTableKey, diffTableText, focusRowMark, isBoxClick, type DiffTableLabels } from "./diff-table.logic";
import { trackModality } from "../lib/modality";
import { afterPaint } from "../lib/paint";

export type { DiffTableLabels } from "./diff-table.logic";
export type DiffTableTone = "accent" | "neutral" | "orange" | "green";
export type DiffTableChange = "removed" | "added" | "unchanged";
export type DiffTableRow = { key: string; name: string; category: string; tone?: DiffTableTone; value: string; change: DiffTableChange };

export type DiffTableProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title?: string;
  columns?: [string, string, string];
  rows?: DiffTableRow[];
  /** Controlled include map (key → included). Omit for uncontrolled (defaultIncluded; every changed row starts included). */
  included?: Record<string, boolean>;
  defaultIncluded?: Record<string, boolean>;
  onIncludedChange?: (included: Record<string, boolean>) => void;
  onToggle?: (key: string, included: boolean) => void;
  /** Controlled accepted state. Omit for uncontrolled (defaultAccepted). */
  accepted?: boolean;
  defaultAccepted?: boolean;
  onApply?: (included: Record<string, boolean>) => void;
  labels?: Partial<DiffTableLabels>;
};

/** AI-proposed edits in tabular data; each changed row toggles its edit. */
export function DiffTable({
  title = "Proposed changes", columns = ["Name", "Category", "Value"], rows = [], included, defaultIncluded, onIncludedChange, onToggle,
  accepted, defaultAccepted = false, onApply, labels, className, ...rest
}: DiffTableProps) {
  const t = { ...DIFF_TABLE_LABELS, ...labels };
  const [innerIncluded, setInnerIncluded] = useState<Record<string, boolean>>(defaultIncluded ?? {});
  const [innerAccepted, setInnerAccepted] = useState(defaultAccepted);
  const inc = included ?? innerIncluded;
  const done = accepted ?? innerAccepted;
  const changed = rows.filter((r) => r.change !== "unchanged");
  const [focusKey, setFocusKey] = useState<string | undefined>(undefined);
  const tabKey = changed.some((r) => r.key === focusKey) ? focusKey : changed[0]?.key;
  const isIn = (r: DiffTableRow) => r.change !== "unchanged" && (inc[r.key] ?? true);
  const text = diffTableText(t, rows.filter((r) => r.change === "removed" && isIn(r)).length, rows.filter((r) => r.change === "added" && isIn(r)).length);
  const table = useRef<HTMLTableElement>(null);
  const focusApplied = useRef(false);
  useEffect(() => trackModality(), []);
  /* an added row reveals only once the table has been painted (lib/paint.ts) */
  const [enter, setEnter] = useState(false);
  useEffect(() => (enter ? undefined : afterPaint(() => setEnter(true))), [enter]);
  useEffect(() => { if (done && focusApplied.current) { focusApplied.current = false; table.current?.closest("[data-slot=diff-table]")?.querySelector<HTMLElement>("[data-diff-table=applied]")?.focus(); } }, [done]);

  const toggle = (r: DiffTableRow, next = !isIn(r)) => {
    if (done || r.change === "unchanged" || next === isIn(r)) return;
    const map = { ...inc, [r.key]: next };
    if (included === undefined) setInnerIncluded(map);
    onIncludedChange?.(map);
    onToggle?.(r.key, next);
  };
  const apply = () => {
    focusApplied.current = true;
    if (accepted === undefined) setInnerAccepted(true);
    onApply?.(Object.fromEntries(changed.map((r) => [r.key, isIn(r)])));
  };

  const s = diffTable();
  const mark = (r: DiffTableRow) => (
    <Checkbox
      size="md"
      tone={r.change === "removed" ? "red" : "green"}
      aria-label={`${r.change === "removed" ? t.remove : t.add} ${r.name}`}
      checked={isIn(r)}
      onCheckedChange={(checked) => toggle(r, checked === true)}
      disabled={done}
      tabIndex={done ? undefined : r.key === tabKey ? 0 : -1}
    />
  );
  const reveal = (r: DiffTableRow, node: ReactNode) =>
    r.change === "added" ? <div data-slot="diff-table-reveal" className={s.reveal()}><div><div data-slot="diff-table-pad" className={s.pad()}>{node}</div></div></div> : node;

  return (
    <div data-slot="diff-table" className={s.base({ class: className })} data-enter={enter ? "" : undefined} {...rest}>
      <div data-slot="diff-table-card" className={s.card()}>
        <div data-slot="diff-table-bar" className={s.bar()}>
          <span data-slot="diff-table-title" className={s.title()}>{title}</span>
          {!done && changed.length > 0 && <span data-slot="diff-table-hint" className={s.hint()}>{t.hint}</span>}
        </div>
        <table ref={table} data-slot="diff-table-table" className={s.table()}>
          <colgroup>{(["name", "category", "value"] as const).map((c) => <col key={c} data-slot="diff-table-col" className={s.col({ col: c })} />)}</colgroup>
          <thead><tr>{columns.map((h, i) => <th key={i} data-slot="diff-table-th" className={s.th()} scope="col">{h}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td data-slot="diff-table-empty" className={s.empty()} colSpan={3}><EmptyState title={t.empty} icon="table" size="block" /></td>
              </tr>
            )}
            {rows.map((r) => {
              const isChanged = r.change !== "unchanged";
              const v = { change: r.change, included: isIn(r) };
              return (
                <tr
                  key={r.key}
                  data-slot="diff-table-row"
                  className={s.row({ ...v, toggleable: isChanged && !done })}
                  data-key={r.key}
                  onClick={isChanged && !done ? (e) => { if (isBoxClick(e.nativeEvent)) return; toggle(r); focusRowMark(e.currentTarget); } : undefined}
                  onKeyDown={isChanged && !done ? (e) => { if ((e.target as Element).matches(DIFF_TABLE_BOX)) diffTableKey(e.nativeEvent, e.target as HTMLElement, () => toggle(r)); } : undefined}
                  onFocus={isChanged ? (e) => { if ((e.target as Element).matches(DIFF_TABLE_BOX)) setFocusKey(r.key); } : undefined}
                >
                  <td data-slot="diff-table-cell" className={s.cell({ ...v, col: "name" })}>{reveal(r, r.name)}</td>
                  <td data-slot="diff-table-cell" className={s.cell({ ...v, col: "category" })}>
                    {reveal(r, <StatusPill tone="neutral" size="sm" dotTone={r.tone && r.tone !== "neutral" ? r.tone : undefined}>{r.category}</StatusPill>)}
                  </td>
                  <td data-slot="diff-table-cell" className={s.cell({ ...v, col: "value" })}>
                    {reveal(r, <span data-slot="diff-table-value" className={s.value()}><span data-slot="diff-table-value-text" className={s.valueText(v)} title={r.value}>{r.value}</span>{isChanged && mark(r)}</span>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div data-slot="diff-table-footer" className={s.footer()}>
          {done ? (
            <StatusPill data-diff-table="applied" className={s.applied()} tone="green" mark tabIndex={-1} data-enter="">{text.applied}</StatusPill>
          ) : (
            <>
              <span data-slot="diff-table-summary" className={s.summary()}>{text.summary}</span>
              {changed.length > 0 && <Button variant="accent" size="sm" disabled={text.total === 0} onClick={apply}>{text.apply}</Button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
