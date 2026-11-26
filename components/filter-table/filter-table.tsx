"use client";
import { useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { filterChips, filterColumns, filterCount, filterGrid, filterLabels, filterMatches, filterPill, filterTag, filterText, type FilterTableColumn, type FilterTableFilter, type FilterTableLabelsInput, type FilterTableRow } from "./filter-table.logic";
import { watchVeils } from "../lib/veil";
import { EmptyState } from "../empty-state/empty-state";
import { filterTable } from "./filter-table.recipe";
import { SegmentedControl } from "../segmented-control/segmented-control";
import { StatusPill } from "../status-pill/status-pill";
import { Tag } from "../tag/tag";

export type {
  FilterTableColumn, FilterTableColumnType, FilterTableFilter, FilterTableLabels, FilterTableLabelsInput, FilterTableRow, FilterTableTone,
} from "./filter-table.logic";
/** The built-in task table's statuses. */
export type FilterTableStatus = "todo" | "progress" | "done";
/** A chip's key: "all", or a value of the filtered field. */
export type FilterTableFilterKey = string;

export type FilterTableProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  /** The columns in order ({ key, label, type?, width? }). Default: the task table (task, date, status, owner). */
  columns?: ReadonlyArray<FilterTableColumn>;
  /** One object per row, values by column key. */
  rows?: ReadonlyArray<FilterTableRow>;
  /** The chips ({ key, label, tone?, count? }; "all" matches every row). Default: All / To do / In Progress / Completed. Counts are derived from the rows. */
  filters?: ReadonlyArray<FilterTableFilter>;
  /** The row field the chips match (default "status"). */
  filterKey?: string;
  /** Controlled filter. Omit for uncontrolled (defaultFilter). */
  filter?: FilterTableFilterKey;
  defaultFilter?: FilterTableFilterKey;
  onChange?: (filter: FilterTableFilterKey) => void;
  labels?: FilterTableLabelsInput;
};

/** Chips (a segmented-control, variant chips) that directly filter a table. */
export function FilterTable({
  columns, rows = [], filters, filterKey = "status", filter, defaultFilter = "all", onChange, labels, className, style, ...rest
}: FilterTableProps) {
  const copy = filterLabels(labels);
  const cols = filterColumns(columns, copy);
  const chips = filterChips(filters, copy);
  const [inner, setInner] = useState<FilterTableFilterKey>(defaultFilter);
  const current = filter ?? inner;
  const s = filterTable();
  /* the edge veils follow the scroll position, measured before the first paint (lib/veil.ts) */
  const card = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => watchVeils(card.current), []);
  const shown = rows.filter((row) => filterMatches(row, current, filterKey)).length;

  return (
    <div data-slot="filter-table" className={s.base({ class: className })} style={style} {...rest}>
      <SegmentedControl
        data-filter-table="filters"
        className={s.filters()}
        variant="chips"
        aria-label={copy.filters}
        value={current}
        options={chips.map((f) => ({ value: f.key, label: f.label, dot: f.key === "all" ? undefined : f.tone, count: filterCount(rows, f, filterKey) }))}
        onValueChange={(value) => {
          if (filter === undefined) setInner(value);
          onChange?.(value);
        }}
      />
      <div ref={card} data-slot="filter-table-card" className={s.card()} role="region" aria-label={copy.region} tabIndex={0}>
        <div data-slot="filter-table-table" className={s.table()} role="table" style={filterGrid(cols) as CSSProperties}>
          <div data-slot="filter-table-head" className={s.head()} role="row">
            {cols.map((c) => <span key={c.key} data-slot="filter-table-th" className={s.th({ type: c.type ?? "text" })} role="columnheader">{c.label}</span>)}
          </div>
          {rows.map((row, i) => (
            <div key={i} data-slot="filter-table-row" className={s.row({ shown: filterMatches(row, current, filterKey) })}>
              <div>
                <div data-slot="filter-table-cells" className={s.cells()} role="row">
                  {cols.map((c) => {
                    const type = c.type ?? "text";
                    const text = filterText(row[c.key]);
                    if (type === "status") {
                      const pill = filterPill(row[c.key], chips);
                      return <span key={c.key} data-slot="filter-table-cell" className={s.cell({ type })} role="cell"><StatusPill data-filter-table="status" className={s.status()} size="sm" tone={pill.tone} dotTone={pill.dotTone}>{pill.label}</StatusPill></span>;
                    }
                    if (type === "tag") {
                      const tag = filterTag(row[c.key], chips);
                      return <span key={c.key} data-slot="filter-table-cell" className={s.cell({ type })} role="cell"><Tag data-filter-table="tag" className={s.tag()} tone={tag.tone}>{tag.label}</Tag></span>;
                    }
                    if (type === "title" || type === "text") return <span key={c.key} data-slot="filter-table-cell" className={s.cell({ type })} role="cell"><span title={text}>{text}</span></span>;
                    return <span key={c.key} data-slot="filter-table-cell" className={s.cell({ type })} role="cell">{text}</span>;
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
        {rows.length === 0
          ? <EmptyState data-filter-table="empty" className={s.empty({ empty: "block" })} title={copy.none} icon="table" size="block" />
          : <EmptyState data-filter-table="empty" className={s.empty({ empty: "row" })} title={copy.empty} align="center" hidden={shown !== 0} />}
      </div>
    </div>
  );
}
