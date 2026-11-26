/* records-table — framework-neutral logic shared by the React, Vue and Svelte adapters:
 * sorting, selection state, tag tones, column widths and label templates. Plain TypeScript, no DOM
 * or framework imports, so every target sorts and selects exactly alike. */

export type RecordsTableValue = string | number | ReadonlyArray<string> | null | undefined;
export type RecordsTableColumnType = "text" | "number" | "tags" | "status" | "link";
export type RecordsTableTone = "green" | "orange" | "red" | "accent" | "neutral";
export type RecordsTableStatusOption = { value: string; label: string; tone?: RecordsTableTone };
export type RecordsTableColumn = {
  key: string;
  label: string;
  type?: RecordsTableColumnType;
  /** Default true. */
  sortable?: boolean;
  /** Default true, except for the first (primary) column, which never hides. */
  hideable?: boolean;
  /** Column width in px; a default per type otherwise. */
  width?: number;
  /** Status columns: the options in their sort order. */
  options?: ReadonlyArray<RecordsTableStatusOption>;
  /** Tags columns. hues (default): each word keeps its own hue, the same in every table, for tags
   * whose colour means something (a team, a label). neutral: every tag is neutral, for descriptive
   * tags (a segment, an industry), so colour stays kept for meaning. */
  tagTone?: "hues" | "neutral";
};
export type RecordsTableRow = { id: string; [key: string]: RecordsTableValue };
export type RecordsTableSortDirection = "ascending" | "descending";
export type RecordsTableSort = { key: string; direction: RecordsTableSortDirection } | null;
export type RecordsTableAction = { type?: "item"; value: string; label: string; tone?: "default" | "danger"; disabled?: boolean } | { type: "separator" };
export type RecordsTableChecked = boolean | "indeterminate";

export type RecordsTableLabels = {
  /** Name of the scrollable region. */
  region: string;
  selectAll: string;
  /** {row} is the row's primary value. */
  selectRow: string;
  /** {column} is the column label. */
  columnMenu: string;
  columns: string;
  sortAscending: string;
  sortDescending: string;
  hideColumn: string;
  /** {row} is the row's primary value. */
  rowActions: string;
  /** {count} is the number of selected rows. */
  selected: string;
  clearSelection: string;
  empty: string;
};

export const RECORDS_TABLE_LABELS: RecordsTableLabels = {
  region: "Records",
  selectAll: "Select all rows",
  selectRow: "Select {row}",
  columnMenu: "{column} options",
  columns: "Columns",
  sortAscending: "Sort ascending",
  sortDescending: "Sort descending",
  hideColumn: "Hide column",
  rowActions: "Actions for {row}",
  selected: "{count} selected",
  clearSelection: "Clear selection",
  empty: "No records",
};

export const recordsLabels = (labels?: Partial<RecordsTableLabels>): RecordsTableLabels => ({ ...RECORDS_TABLE_LABELS, ...labels });

/** Fills {name} placeholders. */
export const fillLabel = (template: string, vars: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));

const DEFAULT_WIDTH: Record<RecordsTableColumnType, number> = { text: 200, number: 120, tags: 220, status: 180, link: 200 };
export const PRIMARY_WIDTH = 260;
/** The trailing column that holds the Columns menu and the row menus. */
export const ACTIONS_WIDTH = 44;

export const columnType = (column: RecordsTableColumn): RecordsTableColumnType => column.type ?? "text";
export const columnWidth = (column: RecordsTableColumn, index: number): number =>
  column.width ?? (index === 0 ? PRIMARY_WIDTH : DEFAULT_WIDTH[columnType(column)]);
export const isSortable = (column: RecordsTableColumn): boolean => column.sortable !== false;
export const isHideable = (column: RecordsTableColumn, index: number): boolean => index > 0 && column.hideable !== false;

/** Sum of the visible column widths: the table never squeezes below it, it scrolls instead. */
export function tableMinWidth(columns: ReadonlyArray<RecordsTableColumn>, hidden: ReadonlyArray<string>): number {
  return columns.reduce((sum, column, index) => sum + (hidden.includes(column.key) ? 0 : columnWidth(column, index)), ACTIONS_WIDTH);
}

/* tags take one of the eight tag hues (the Tag's hues), the same for the same word in every table */
export const TAG_TONES = ["blue", "green", "orange", "purple", "red", "cyan", "yellow", "pink"] as const;
export type RecordsTableTagTone = (typeof TAG_TONES)[number] | "neutral";
export function tagTone(tag: string, column?: RecordsTableColumn): RecordsTableTagTone {
  if (column?.tagTone === "neutral") return "neutral";
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_TONES[hash % TAG_TONES.length]!;
}
/** Tags shown in a cell before the rest collapse into "+n"; every tag is in the cell's title. */
export const MAX_TAGS = 2;

export const isBlank = (value: RecordsTableValue): boolean =>
  value == null || value === "" || (Array.isArray(value) && value.length === 0);

export const textOf = (value: RecordsTableValue): string =>
  value == null ? "" : Array.isArray(value) ? value.join(", ") : String(value);

/** Locale of number cells unless the table is given one. */
export const DEFAULT_LOCALE = "en-US";
const formatters = new Map<string, Intl.NumberFormat>();
/** Numbers are grouped for `locale` (default en-US); one formatter per locale is kept. */
export function formatNumber(value: RecordsTableValue, locale: string = DEFAULT_LOCALE): string {
  if (typeof value !== "number") return textOf(value);
  let format = formatters.get(locale);
  if (!format) { format = new Intl.NumberFormat(locale); formatters.set(locale, format); }
  return format.format(value);
}

export const linkHref = (value: string): string => (/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);

export const statusOption = (column: RecordsTableColumn, value: RecordsTableValue): RecordsTableStatusOption | undefined =>
  column.options?.find((option) => option.value === value);

/** The value a cell sorts by: a number, a string, or null (blank cells always sort last). */
export type SortKey = number | string | null;
export function sortKey(column: RecordsTableColumn, value: RecordsTableValue): SortKey {
  if (isBlank(value)) return null;
  const type = columnType(column);
  if (type === "number") return typeof value === "number" ? value : Number(value);
  if (type === "status") {
    const index = (column.options ?? []).findIndex((option) => option.value === value);
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  }
  return textOf(value);
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
export function compareKeys(a: SortKey, b: SortKey, direction: RecordsTableSortDirection): number {
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
  const order = typeof a === "number" && typeof b === "number" ? a - b : collator.compare(String(a), String(b));
  return direction === "ascending" ? order : -order;
}

/** Stable sort: equal keys keep their given order. */
export function sortRows<T extends RecordsTableRow>(rows: ReadonlyArray<T>, columns: ReadonlyArray<RecordsTableColumn>, sort: RecordsTableSort): T[] {
  const column = sort ? columns.find((c) => c.key === sort.key) : undefined;
  if (!sort || !column) return rows.slice();
  return rows
    .map((row, index) => ({ row, index, key: sortKey(column, row[column.key]) }))
    .sort((a, b) => compareKeys(a.key, b.key, sort.direction) || a.index - b.index)
    .map((entry) => entry.row);
}

/** Header click, three states (the data-table convention): a new column sorts ascending, a second
 * click descending, a third returns to the natural order (null; aria-sort none on every header). */
export const nextSort = (sort: RecordsTableSort, key: string): RecordsTableSort =>
  sort?.key !== key ? { key, direction: "ascending" } : sort.direction === "ascending" ? { key, direction: "descending" } : null;

export const ariaSort = (sort: RecordsTableSort, key: string): "ascending" | "descending" | "none" =>
  sort?.key === key ? sort.direction : "none";

/** How many of the table's rows are selected (sets, so 500 rows stay cheap). */
export function selectedCount(ids: ReadonlyArray<string>, selected: ReadonlyArray<string>): number {
  const on = new Set(selected);
  let count = 0;
  for (const id of ids) if (on.has(id)) count++;
  return count;
}

export function selectAllState(ids: ReadonlyArray<string>, selected: ReadonlyArray<string>): RecordsTableChecked {
  if (!ids.length) return false;
  const count = selectedCount(ids, selected);
  return count === 0 ? false : count === ids.length ? true : "indeterminate";
}

/** Select-all: everything when anything is missing, otherwise nothing. Selected ids of rows that are
 * not in the table are kept. */
export function toggleAll(ids: ReadonlyArray<string>, selected: ReadonlyArray<string>): string[] {
  const all = ids.length > 0 && selectedCount(ids, selected) === ids.length;
  if (all) { const mine = new Set(ids); return selected.filter((id) => !mine.has(id)); }
  const on = new Set(selected);
  return [...selected, ...ids.filter((id) => !on.has(id))];
}

export const toggleOne = (selected: ReadonlyArray<string>, id: string, on: boolean): string[] =>
  on ? (selected.includes(id) ? selected.slice() : [...selected, id]) : selected.filter((s) => s !== id);

export const toggleHidden = (hidden: ReadonlyArray<string>, key: string, hide: boolean): string[] =>
  hide ? (hidden.includes(key) ? hidden.slice() : [...hidden, key]) : hidden.filter((h) => h !== key);

/** The primary (first) column's value, used to name a row's checkbox and menu. */
export const rowName = (row: RecordsTableRow, columns: ReadonlyArray<RecordsTableColumn>): string =>
  textOf(columns[0] ? row[columns[0].key] : row.id) || row.id;

/** Empty-state cell spans every visible column plus the actions column. */
export const visibleSpan = (columns: ReadonlyArray<RecordsTableColumn>, hidden: ReadonlyArray<string>): number =>
  columns.filter((c) => !hidden.includes(c.key)).length + 1;

/* ---- opening a row (onRowOpen) ----
 * With onRowOpen the rows are the table's main target (an issue list: a click opens the issue). A
 * click on a row opens it, except on something of its own (the checkbox, a link, the row menu):
 * those keep their own action. From the keyboard the rows are one tab stop (roving tabindex):
 * ArrowUp / ArrowDown (Home / End) move between rows, Enter opens, Space selects. */

const OWN_TARGET = "a,button,input,label,select,textarea,[role=menuitem],[data-records-table],[data-slot=records-table-gutter]";

/** Did this click land on the row itself (not on its checkbox, link or menu)? */
export function rowClickOpens(event: { target: EventTarget | null; currentTarget: EventTarget | null; defaultPrevented?: boolean }): boolean {
  if (event.defaultPrevented) return false;
  const target = event.target as Element | null;
  const row = event.currentTarget as Element | null;
  const own = target?.closest?.(OWN_TARGET);
  return !own || !row?.contains(own);
}

/** Keys on a focused row. Returns "open" for Enter; moves the focus itself for the arrows, Home
 * and End; clicks the row's checkbox for Space. Keys from inside the row (its checkbox, link or
 * menu trigger) are left alone. */
export function rowKey(event: KeyboardEvent | { key: string; target: EventTarget | null; currentTarget: EventTarget | null; preventDefault(): void }): "open" | null {
  const row = event.currentTarget as HTMLElement | null;
  if (!row || event.target !== row) return null;
  const rows = () => Array.from(row.parentElement?.querySelectorAll<HTMLElement>(":scope > [data-slot=records-table-row]") ?? []);
  const go = (next: HTMLElement | undefined) => { if (next) { next.focus(); next.scrollIntoView({ block: "nearest" }); } };
  switch (event.key) {
    case "Enter": event.preventDefault(); return "open";
    case " ": {
      event.preventDefault();
      row.querySelector<HTMLElement>("[data-records-table=check] input, [data-records-table=check]")?.click();
      /* the checkbox takes the focus when clicked: it stays on the row */
      row.focus();
      requestAnimationFrame(() => { if (row.isConnected && document.activeElement !== row) row.focus(); });
      return null;
    }
    case "ArrowDown": event.preventDefault(); go(rows()[rows().indexOf(row) + 1]); return null;
    case "ArrowUp": event.preventDefault(); go(rows()[rows().indexOf(row) - 1]); return null;
    case "Home": event.preventDefault(); go(rows()[0]); return null;
    case "End": { event.preventDefault(); const all = rows(); go(all[all.length - 1]); return null; }
    default: return null;
  }
}
