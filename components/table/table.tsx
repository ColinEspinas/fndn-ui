"use client";
import { useLayoutEffect, useRef, type HTMLAttributes, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { table } from "./table.recipe";
import { watchVeils } from "../lib/veil";
import { truncationTitles } from "../lib/truncate";

export type TableColumn = {
  key: string;
  label: ReactNode;
  /** A number column: aligned to the end, tabular figures. */
  numeric?: boolean;
  /** The column that gives way (a title): it takes the room left and cuts its text, with a title. */
  truncate?: boolean;
};

export type TableProps = Omit<HTMLAttributes<HTMLTableElement>, "children"> & {
  /** Data form: the columns in order. With columns and rows the Table renders its own header and body. */
  columns?: ReadonlyArray<TableColumn>;
  /** Data form: one object per row, values by column key. */
  rows?: ReadonlyArray<Record<string, ReactNode>>;
  /** Data form: the caption under the rows. With parts, use <TableCaption>. */
  caption?: ReactNode;
  /** card: the records table's surface card with rules between rows and columns. flush: no card,
   * a hairline between rows only, single-line rows (an issue list, a file list). */
  variant?: "card" | "flush";
  /** The data is on its way: aria-busy, and in the data form placeholder rows in place of the rows. */
  loading?: boolean;
  /** How many placeholder rows while loading (default 5). */
  loadingRows?: number;
  /** The parts (TableHeader, TableBody, TableCaption …), when columns and rows are not given. */
  children?: ReactNode;
};

const shown = (v: ReactNode) => v != null && v !== false && v !== "";
/* an empty class string is no class attribute (Vue and Svelte render none) */
const cls = (c: string) => c || undefined;

/** A plain data table in the records table's look, or flush in a pane.
 * The root is the scrolling card; every other prop (aria-label …) goes to the <table>. */
export function Table({ columns, rows, caption, variant = "card", loading = false, loadingRows = 5, className, style, children, ...rest }: TableProps) {
  const r = table({ variant });
  /* the edge veils follow the scroll position, measured before the first paint (lib/veil.ts); a cut cell carries its full text as a title */
  const card = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => watchVeils(card.current), []);
  useLayoutEffect(() => truncationTitles(card.current, "[data-slot=table-cell]"), []);
  return (
    <div ref={card} data-slot="table" className={r.base({ class: className })} style={style}>
      <table data-slot="table-table" className={r.table()} aria-busy={loading || undefined} {...rest}>
        {columns ? (
          <>
            {shown(caption) && <TableCaption>{caption}</TableCaption>}
            <TableHeader>
              <TableRow>
                {columns.map((c) => <TableHead key={c.key} numeric={c.numeric} truncate={c.truncate}>{c.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: loadingRows }, (_, i) => (
                    <TableRow key={i}>
                      {columns.map((c) => <TableCell key={c.key} numeric={c.numeric} truncate={c.truncate}><TableSkeleton numeric={c.numeric} /></TableCell>)}
                    </TableRow>
                  ))
                : (rows ?? []).map((row, i) => (
                    <TableRow key={i}>
                      {columns.map((c) => <TableCell key={c.key} numeric={c.numeric} truncate={c.truncate}>{row[c.key]}</TableCell>)}
                    </TableRow>
                  ))}
            </TableBody>
          </>
        ) : children}
      </table>
    </div>
  );
}

export function TableHeader({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead data-slot="table-header" className={cls(table().header({ class: className }))} {...rest} />;
}

export function TableBody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody data-slot="table-body" className={cls(table().body({ class: className }))} {...rest} />;
}

export function TableRow({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr data-slot="table-row" className={table().row({ class: className })} {...rest} />;
}

export type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean; truncate?: boolean };

export function TableHead({ numeric, truncate, className, scope = "col", ...rest }: TableHeadProps) {
  return <th data-slot="table-head" scope={scope} className={table({ numeric, truncate }).head({ class: className })} {...rest} />;
}

export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean; truncate?: boolean };

export function TableCell({ numeric, truncate, className, ...rest }: TableCellProps) {
  return <td data-slot="table-cell" className={table({ numeric, truncate }).cell({ class: className })} {...rest} />;
}

/** The table's name, under the rows. Put it first inside <Table> (HTML wants the caption first). */
export function TableCaption({ className, ...rest }: HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption data-slot="table-caption" className={table().caption({ class: className })} {...rest} />;
}

/** A placeholder bar for a loading row (the data form draws them itself). */
export function TableSkeleton({ numeric, className, ...rest }: HTMLAttributes<HTMLSpanElement> & { numeric?: boolean }) {
  return <span data-slot="table-skeleton" className={table({ numeric }).skeleton({ class: className })} aria-hidden {...rest} />;
}
