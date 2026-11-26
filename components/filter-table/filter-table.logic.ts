/* filter-table — the table's model: columns, filters and rows from props (shared by the React,
 * Vue and Svelte adapters). Plain TypeScript, no DOM. */

/* ---- the table's model: columns, filters and rows from props (shared by the three adapters) ----
 * A column has a type that sets its look (title: 500 ink, cut with a title; text: ink-2, cut with
 * a title; date and number: whole, tabular; status: the row's StatusPill; tag: the row's Tag) and
 * a share of the width (fr). A status (to do, failed, live) is a pill; a label people assign (an
 * environment, a category) is a tag.
 * The filters (chips) match one field of the rows (filterKey, "status" by default); "all" matches
 * every row. A status or tag cell shows the filter its value matches: that filter's label in that
 * filter's tone. Without columns and filters the table is the built-in task table (task, date,
 * status, owner; All, To do, In Progress, Completed), named through labels. */

export type FilterTableColumnType = "title" | "text" | "date" | "number" | "status" | "tag";
/** A filter's hue: its chip's dot and the pill or Tag of its rows. */
export type FilterTableTone = "blue" | "green" | "orange" | "red" | "purple" | "cyan" | "yellow" | "pink";
export type FilterTableColumn = { key: string; label: string; type?: FilterTableColumnType; width?: number };
export type FilterTableFilter = { key: string; label: string; tone?: FilterTableTone; count?: number };
export type FilterTableRow = Record<string, string | number | null | undefined>;
export type FilterTableLabels = {
  /** Name of the chip group. */
  filters: string;
  /** Name of the scrollable table region. */
  region: string;
  /** Shown when no row matches. */
  empty: string;
  /** Shown when there are no rows at all. */
  none: string;
  /** Header labels of the built-in columns (when columns is not given). */
  columns: { task: string; date: string; status: string; owner: string };
  /** Names of the built-in statuses (when filters is not given). */
  statuses: { todo: string; progress: string; done: string };
};
export type FilterTableLabelsInput = Partial<Omit<FilterTableLabels, "columns" | "statuses">> & {
  columns?: Partial<FilterTableLabels["columns"]>;
  statuses?: Partial<FilterTableLabels["statuses"]>;
};

const DEFAULT_LABELS: FilterTableLabels = {
  filters: "Filter by status",
  region: "Scrollable task table",
  empty: "No tasks match this filter",
  none: "No tasks",
  columns: { task: "Task name", date: "Date", status: "Status", owner: "Advisor" },
  statuses: { todo: "To do", progress: "In Progress", done: "Completed" },
};
/** The labels with their defaults. */
export const filterLabels = (labels?: FilterTableLabelsInput): FilterTableLabels => ({
  ...DEFAULT_LABELS, ...labels,
  columns: { ...DEFAULT_LABELS.columns, ...labels?.columns },
  statuses: { ...DEFAULT_LABELS.statuses, ...labels?.statuses },
});

/** The columns: the caller's, or the built-in task table's. */
export const filterColumns = (columns: ReadonlyArray<FilterTableColumn> | undefined, copy: FilterTableLabels): FilterTableColumn[] =>
  columns ? [...columns] : [
    { key: "task", label: copy.columns.task, type: "title" },
    { key: "date", label: copy.columns.date, type: "date" },
    { key: "status", label: copy.columns.status, type: "status" },
    { key: "owner", label: copy.columns.owner, type: "text" },
  ];

/** The chips: the caller's, or All and the three built-in statuses (orange, blue, green: all three pill tones). */
export const filterChips = (filters: ReadonlyArray<FilterTableFilter> | undefined, copy: FilterTableLabels): FilterTableFilter[] =>
  filters ? [...filters] : [
    { key: "all", label: "All" },
    { key: "todo", label: copy.statuses.todo, tone: "orange" },
    { key: "progress", label: copy.statuses.progress, tone: "blue" },
    { key: "done", label: copy.statuses.done, tone: "green" },
  ];

const FR: Record<FilterTableColumnType, number> = { title: 1.3, text: 0.9, date: 0.6, number: 0.8, status: 0.95, tag: 0.95 };
/** The grid of the head and of every row (--fndn-filter-cols) and the table's least width (--fndn-filter-min). */
export const filterGrid = (columns: ReadonlyArray<FilterTableColumn>): Record<string, string> => ({
  "--fndn-filter-cols": columns.map((c) => `minmax(0,${c.width ?? FR[c.type ?? "text"]}fr)`).join(" "),
  "--fndn-filter-min": `${Math.max(420, columns.length * 105)}px`,
});

/** Does the row match the filter? */
export const filterMatches = (row: FilterTableRow, filter: string, filterKey = "status"): boolean =>
  filter === "all" || String(row[filterKey] ?? "") === filter;

/** How many rows a chip matches (its own count wins). */
export const filterCount = (rows: ReadonlyArray<FilterTableRow>, chip: FilterTableFilter, filterKey = "status"): number =>
  chip.count ?? rows.filter((row) => filterMatches(row, chip.key, filterKey)).length;

/** The Tag of a value: the matching filter's label and tone (neutral and the raw value when none matches). */
export const filterTag = (value: unknown, chips: ReadonlyArray<FilterTableFilter>): { label: string; tone: FilterTableTone | "neutral" } => {
  const chip = chips.find((c) => c.key !== "all" && c.key === String(value ?? ""));
  return { label: chip?.label ?? String(value ?? ""), tone: chip?.tone ?? "neutral" };
};

/** The StatusPill of a status value: the matching filter's label; green, orange, red and blue are
 * the pill's own tones, the other hues a neutral pill whose dot takes the hue. */
export const filterPill = (value: unknown, chips: ReadonlyArray<FilterTableFilter>): { label: string; tone: "neutral" | "green" | "orange" | "red" | "blue"; dotTone?: "purple" | "cyan" | "yellow" | "pink" } => {
  const { label, tone } = filterTag(value, chips);
  if (tone === "purple" || tone === "cyan" || tone === "yellow" || tone === "pink") return { label, tone: "neutral", dotTone: tone };
  return { label, tone };
};

/** The text of a cell. */
export const filterText = (value: unknown): string => (value == null ? "" : String(value));
