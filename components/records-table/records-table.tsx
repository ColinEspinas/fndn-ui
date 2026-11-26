"use client";
import { Menu as ArkMenu, useMenu } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import { ArrowDown, ArrowSquareOut, ArrowUp, Columns, DotsThree, EyeSlash } from "@phosphor-icons/react";
import { createContext, forwardRef, memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { Button, type ButtonProps } from "../button/button";
import { Checkbox } from "../checkbox/checkbox";
import { Count } from "../count/count";
import { EmptyState } from "../empty-state/empty-state";
import { Menu, type MenuEntry } from "../menu/menu";
import { menu as menuRecipe } from "../menu/menu.recipe";
import { recordsTable } from "./records-table.recipe";
import { Tag } from "../tag/tag";
import { Tooltip } from "../tooltip/tooltip";
import { glide } from "../lib/glide";
import { trackModality } from "../lib/modality";
import { watchVeils } from "../lib/veil";
import {
  ACTIONS_WIDTH, DEFAULT_LOCALE, MAX_TAGS, ariaSort, columnType, columnWidth, fillLabel, formatNumber, isBlank, isHideable, isSortable,
  linkHref, nextSort, recordsLabels, rowClickOpens, rowKey, rowName, selectAllState, selectedCount, sortRows, statusOption, tableMinWidth, tagTone, textOf,
  toggleAll, toggleHidden, toggleOne, visibleSpan,
  type RecordsTableAction, type RecordsTableColumn, type RecordsTableLabels, type RecordsTableRow, type RecordsTableSort,
} from "./records-table.logic";

export type {
  RecordsTableAction, RecordsTableColumn, RecordsTableLabels, RecordsTableRow, RecordsTableSort, RecordsTableSortDirection,
  RecordsTableStatusOption, RecordsTableTone, RecordsTableValue,
} from "./records-table.logic";

export type RecordsTableProps = {
  columns: ReadonlyArray<RecordsTableColumn>;
  rows?: ReadonlyArray<RecordsTableRow>;
  /** Controlled sort. Omit for uncontrolled (defaultSort). */
  sort?: RecordsTableSort;
  defaultSort?: RecordsTableSort;
  onSortChange?: (sort: RecordsTableSort) => void;
  /** Controlled selection (row ids). Omit for uncontrolled (defaultSelected). */
  selected?: ReadonlyArray<string>;
  defaultSelected?: ReadonlyArray<string>;
  onSelectedChange?: (selected: string[]) => void;
  /** Controlled hidden column keys. Omit for uncontrolled (defaultHiddenColumns). */
  hiddenColumns?: ReadonlyArray<string>;
  defaultHiddenColumns?: ReadonlyArray<string>;
  onHiddenColumnsChange?: (hidden: string[]) => void;
  /** Entries of the menu at the end of every row (one menu shared by all rows). Without them the rows have no menu. */
  rowActions?: ReadonlyArray<RecordsTableAction>;
  onRowAction?: (value: string, rowId: string) => void;
  /** A row was opened: a click on it (not on its checkbox, link or menu) or Enter on the focused row.
   * With it the rows are one tab stop; the arrow keys move between them, Space selects. */
  onRowOpen?: (rowId: string) => void;
  /** Bulk actions in the selection bar, after the count (Buttons, a Menu); a function receives the selected ids. */
  selectionActions?: ReactNode | ((selected: string[]) => ReactNode);
  /** Locale of the number cells (grouping, decimals). Default en-US. */
  locale?: string;
  labels?: Partial<RecordsTableLabels>;
  className?: string;
  style?: CSSProperties;
};

function useControllable<T>(value: T | undefined, initial: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [inner, setInner] = useState<T>(initial);
  const current = value === undefined ? inner : value;
  return [current, (next: T) => { if (value === undefined) setInner(next); onChange?.(next); }];
}

const focusColumnsTrigger = (root: HTMLElement | null) => {
  /* the hidden column took its menu trigger with it: focus moves to the Columns menu, where it can come back */
  setTimeout(() => root?.querySelector<HTMLElement>("[data-records-table=columns-menu] [data-menu=trigger]")?.focus(), 0);
};

/* class strings are worked out once: a table re-renders hundreds of cells */
const r = recordsTable();
const m = menuRecipe();
const CELL = [r.cell(), r.cell({ numeric: true }), r.cell({ primary: true }), r.cell({ primary: true, numeric: true })];
const cellClass = (type: string, primary = false) => CELL[(primary ? 2 : 0) + (type === "number" ? 1 : 0)];
const ACTION_CELL = r.cell({ actions: true });
const ROW = [r.row(), r.row({ selected: true })];
const OPEN_ROW = [r.row({ openable: true }), r.row({ openable: true, selected: true })];
const ROWNUM = [r.rownum(), r.rownum({ selected: true })];
const BODY_CHECK = [recordsTable({ body: true }).check(), recordsTable({ body: true, selected: true }).check()];
const TRIGGER_CLASS = {
  columns: `${r.menuTrigger()}`,
  column: `${recordsTable({ trigger: "column" }).menuTrigger()}`,
  row: `${recordsTable({ trigger: "row" }).menuTrigger()}`,
};
/* the icon-only menu triggers: Buttons ghost xs square rounded muted, with a tooltip of their name */
/* it is the child of a tooltip's and a menu's asChild trigger: their props and ref go through */
const TriggerButton = forwardRef<HTMLButtonElement, ButtonProps & { at: keyof typeof TRIGGER_CLASS }>(function TriggerButton({ at, className, ...rest }, ref) {
  return <Button ref={ref} data-menu="trigger" data-records-table="menu-trigger" variant="ghost" size="xs" shape="rounded" square muted {...rest} className={className ? `${TRIGGER_CLASS[at]} ${className}` : TRIGGER_CLASS[at]} />;
});
const ROW_MENU_POSITIONING = { placement: "bottom-end", gutter: 4 } as const;

/* The row menu is one Zag menu with a trigger per row (the trigger's value is the row id). Its
 * machine lives here, and the rows read the trigger props from this context: it changes only when
 * the menu opens, closes or moves to another row, so sorting and selecting never re-render the
 * triggers, and the column menus (ordinary Menus) are not nested in it. */
type RowMenuApi = ReturnType<typeof useMenu>["api"];
const RowMenuContext = createContext<RowMenuApi | null>(null);

/** A records grid: sortable headers, row selection, column and row menus. */
export function RecordsTable({ rowActions, onRowAction, ...props }: RecordsTableProps) {
  const hasActions = !!rowActions && rowActions.length > 0;
  const activeRow = useRef<string | null>(null);
  const action = useRef(onRowAction);
  action.current = onRowAction;
  const menu = useMenu({
    positioning: ROW_MENU_POSITIONING,
    onTriggerValueChange: (details) => { activeRow.current = details.value; },
    onSelect: (details) => { if (activeRow.current !== null) action.current?.(details.value, activeRow.current); },
  });
  const { open, triggerValue } = menu.api;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const triggers = useMemo(() => menu.api, [open, triggerValue]);
  return (
    <RowMenuContext.Provider value={hasActions ? triggers : null}>
      <Table {...props} hasActions={hasActions} />
      {hasActions && (
        <ArkMenu.RootProvider value={menu}>
          <RowMenu actions={rowActions!} />
        </ArkMenu.RootProvider>
      )}
    </RowMenuContext.Provider>
  );
}

function RowMenu({ actions }: { actions: ReadonlyArray<RecordsTableAction> }) {
  const content = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLSpanElement>(null);
  useEffect(() => (content.current && highlight.current ? glide(content.current, highlight.current, { rows: "[data-slot=menu-item]", follow: "highlighted" }) : undefined), []);
  return (
    <Portal>
      <ArkMenu.Positioner data-slot="menu-positioner" data-records-table="row-menu" className={`${m.positioner()} ${r.rowMenu()}`}>
        <ArkMenu.Content ref={content} data-slot="menu-content" className={m.content()}>
          <span ref={highlight} data-slot="menu-highlight" className={m.highlight()} aria-hidden />
          {actions.map((item, i) => item.type === "separator" ? (
            <ArkMenu.Separator key={`separator-${i}`} data-slot="menu-separator" className={m.separator()} />
          ) : (
            <ArkMenu.Item key={item.value} value={item.value} disabled={item.disabled} data-slot="menu-item" className={m.item({ tone: item.tone })}>
              <span data-slot="menu-item-text" className={m.itemText()}>{item.label}</span>
            </ArkMenu.Item>
          ))}
        </ArkMenu.Content>
      </ArkMenu.Positioner>
    </Portal>
  );
}

type TableProps = Omit<RecordsTableProps, "rowActions" | "onRowAction"> & { hasActions: boolean };

const Table = memo(function Table({
  columns, rows = [], sort: sortProp, defaultSort = null, onSortChange, selected: selectedProp, defaultSelected = [], onSelectedChange,
  hiddenColumns: hiddenProp, defaultHiddenColumns = [], onHiddenColumnsChange, locale = DEFAULT_LOCALE, labels, className, style, hasActions,
  onRowOpen, selectionActions,
}: TableProps) {
  const copy = useMemo(() => recordsLabels(labels), [labels]);
  const [sort, setSort] = useControllable<RecordsTableSort>(sortProp, defaultSort, onSortChange);
  const [selected, setSelected] = useControllable<ReadonlyArray<string>>(selectedProp, defaultSelected, (next) => onSelectedChange?.(next.slice()));
  const [hidden, setHidden] = useControllable<ReadonlyArray<string>>(hiddenProp, defaultHiddenColumns, (next) => onHiddenColumnsChange?.(next.slice()));
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => trackModality(), []);
  /* the end veil follows the scroll position, measured before the first paint (lib/veil.ts) */
  const scroll = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => watchVeils(scroll.current), []);

  /* rows keep their identity across a sort, so React only moves them */
  const display = useMemo(() => sortRows(rows, columns, sort), [rows, columns, sort]);
  const ids = useMemo(() => rows.map((row) => row.id), [rows]);
  const on = useMemo(() => new Set(selected), [selected]);
  const count = selectedCount(ids, selected);
  const hideable = columns.filter((column, index) => isHideable(column, index));
  /* one toggle for every row, reading the latest selection */
  const latest = useRef({ selected, setSelected });
  latest.current = { selected, setSelected };
  const toggleRow = useCallback((id: string, checked: boolean) => latest.current.setSelected(toggleOne(latest.current.selected, id, checked)), []);
  /* opening a row: one stable handler for every row, reading the latest callback; the rows are one
   * tab stop (the last one focused, the first at the start) */
  const opener = useRef(onRowOpen);
  opener.current = onRowOpen;
  const openRow = useCallback((id: string) => opener.current?.(id), []);
  const [focusId, setFocusId] = useState<string | null>(null);
  const tabRow = onRowOpen ? (display.some((row) => row.id === focusId) ? focusId : display[0]?.id ?? null) : null;

  const hide = (key: string) => { setHidden(toggleHidden(hidden, key, true)); focusColumnsTrigger(root.current); };
  const columnMenu = (column: RecordsTableColumn, index: number): MenuEntry[] => [
    ...(isSortable(column) ? [
      { value: "sort-ascending", label: copy.sortAscending, icon: <ArrowUp data-slot="icon" weight="bold" /> },
      { value: "sort-descending", label: copy.sortDescending, icon: <ArrowDown data-slot="icon" weight="bold" /> },
    ] : []),
    ...(isSortable(column) && isHideable(column, index) ? [{ type: "separator" as const }] : []),
    ...(isHideable(column, index) ? [{ value: "hide", label: copy.hideColumn, icon: <EyeSlash data-slot="icon" weight="bold" /> }] : []),
  ];
  const onColumnMenu = (column: RecordsTableColumn) => (value: string) => {
    if (value === "sort-ascending" || value === "sort-descending") setSort({ key: column.key, direction: value === "sort-ascending" ? "ascending" : "descending" });
    if (value === "hide") hide(column.key);
  };

  const all = selectAllState(ids, selected);
  return (
    <div ref={root} data-slot="records-table" className={r.base({ class: className })} style={style}>
      <div ref={scroll} data-slot="records-table-scroll" className={r.scroll()} role="region" aria-label={copy.region} tabIndex={0}>
        <table data-slot="records-table-table" className={r.table()} style={{ minWidth: tableMinWidth(columns, hidden) }}>
          <thead>
            <tr data-slot="records-table-head-row" className={r.headRow()}>
              {columns.map((column, index) => {
                const items = columnMenu(column, index);
                const menuLabel = fillLabel(copy.columnMenu, { column: column.label });
                const v = { primary: index === 0, numeric: columnType(column) === "number" };
                return (
                  <th
                    key={column.key}
                    data-slot="records-table-th"
                    className={r.th(v)}
                    scope="col"
                    data-col={column.key}
                    aria-sort={isSortable(column) ? ariaSort(sort, column.key) : undefined}
                    hidden={hidden.includes(column.key)}
                    style={{ "--fndn-col-width": `${columnWidth(column, index)}px` } as CSSProperties}
                  >
                    <div data-slot="records-table-th-inner" className={r.thInner(v)}>
                      {index === 0 && (
                        <span data-slot="records-table-gutter" className={r.gutter()}>
                          <Checkbox data-records-table="check" className={r.check()} checked={all} disabled={!ids.length} aria-label={copy.selectAll} onCheckedChange={() => setSelected(toggleAll(ids, selected))} />
                        </span>
                      )}
                      {isSortable(column) ? (
                        <button type="button" data-slot="records-table-sort" className={r.sort(v)} onClick={() => setSort(nextSort(sort, column.key))}>
                          <span data-slot="records-table-th-label" className={r.thLabel(v)}>{column.label}</span>
                          <span data-slot="records-table-sort-icon" className={r.sortIcon()} aria-hidden="true"><ArrowDown data-slot="icon" weight="bold" /></span>
                        </button>
                      ) : (
                        <span data-slot="records-table-th-label" className={r.thLabel(v)}>{column.label}</span>
                      )}
                      {items.length > 0 && (
                        <Menu data-records-table="col-menu" className={r.colMenu(v)} items={items} placement="bottom-end" onSelect={onColumnMenu(column)}>
                          <Tooltip content={menuLabel}>
                            <TriggerButton at="column" aria-label={menuLabel} icon={<DotsThree data-slot="icon" weight="bold" />} />
                          </Tooltip>
                        </Menu>
                      )}
                    </div>
                  </th>
                );
              })}
              <th data-slot="records-table-th" className={r.th({ actions: true })} scope="col" style={{ "--fndn-col-width": `${ACTIONS_WIDTH}px` } as CSSProperties}>
                {hideable.length > 0 && (
                  <Menu
                    data-records-table="columns-menu"
                    className={r.columnsMenu()}
                    placement="bottom-end"
                    items={[{ type: "group", label: copy.columns, items: hideable.map((column) => ({ type: "checkbox" as const, value: column.key, label: column.label, checked: !hidden.includes(column.key) })) }]}
                    onCheckedChange={(key, checked) => setHidden(toggleHidden(hidden, key, !checked))}
                  >
                    <Tooltip content={copy.columns}>
                      <TriggerButton at="columns" aria-label={copy.columns} icon={<Columns data-slot="icon" weight="bold" />} />
                    </Tooltip>
                  </Menu>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {display.length ? display.map((row) => (
              <Row
                key={row.id} row={row} columns={columns} hidden={hidden} on={on.has(row.id)} copy={copy} locale={locale} hasActions={hasActions} onToggle={toggleRow}
                openable={!!onRowOpen} tabbable={tabRow === row.id} onOpen={openRow} onFocusRow={setFocusId}
              />
            )) : (
              <tr data-slot="records-table-empty-row" className={r.emptyRow()}>
                <td data-slot="records-table-empty" className={r.empty()} colSpan={visibleSpan(columns, hidden)}><EmptyState title={copy.empty} icon="table" size="block" /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div data-slot="records-table-selection" className={r.selection({ open: count > 0 })} inert={count === 0 ? true : undefined}>
        <div data-slot="records-table-selection-inner" className={r.selectionInner()}>
          <span data-slot="records-table-selection-count" className={r.selectionCount()} role="status">{fillLabel(copy.selected, { count })}</span>
          {selectionActions != null && (
            <div data-slot="records-table-selection-actions" className={r.selectionActions()}>
              {typeof selectionActions === "function" ? selectionActions(selected.filter((id) => ids.includes(id))) : selectionActions}
            </div>
          )}
          <Button data-records-table="selection-clear" className={r.selectionClear()} variant="ghost" size="sm" onClick={() => { const mine = new Set(ids); setSelected(selected.filter((id) => !mine.has(id))); }}>
            {copy.clearSelection}
          </Button>
        </div>
      </div>
    </div>
  );
});

type RowProps = {
  row: RecordsTableRow;
  columns: ReadonlyArray<RecordsTableColumn>;
  hidden: ReadonlyArray<string>;
  on: boolean;
  copy: RecordsTableLabels;
  locale: string;
  hasActions: boolean;
  onToggle: (id: string, checked: boolean) => void;
  openable: boolean;
  tabbable: boolean;
  onOpen: (id: string) => void;
  onFocusRow: (id: string) => void;
};

/* A row renders again only when its selection, its data or the columns change: a sort moves it, a
 * select-all re-renders its checkbox and nothing else. */
const Row = memo(function Row({ row, columns, hidden, on, copy, locale, hasActions, onToggle, openable, tabbable, onOpen, onFocusRow }: RowProps) {
  const name = rowName(row, columns);
  const open = openable ? {
    tabIndex: tabbable ? 0 : -1,
    onClick: (event: MouseEvent<HTMLTableRowElement>) => { if (rowClickOpens(event)) onOpen(row.id); },
    onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => { if (rowKey(event) === "open") onOpen(row.id); },
    onFocus: (event: FocusEvent<HTMLTableRowElement>) => { if (event.target === event.currentTarget) onFocusRow(row.id); },
  } : {};
  return (
    <tr data-slot="records-table-row" className={openable ? OPEN_ROW[on ? 1 : 0] : ROW[on ? 1 : 0]} data-id={row.id} {...open}>
      {columns[0] && (
        <td data-slot="records-table-cell" className={cellClass(columnType(columns[0]), true)} data-col={columns[0].key} hidden={hidden.includes(columns[0].key)}>
          <div data-slot="records-table-primary" className={r.primary()}>
            <span data-slot="records-table-gutter" className={r.gutter()}>
              <span data-slot="records-table-rownum" className={ROWNUM[on ? 1 : 0]} aria-hidden="true" />
              <Checkbox data-records-table="check" className={BODY_CHECK[on ? 1 : 0]} checked={on} aria-label={fillLabel(copy.selectRow, { row: name })} onCheckedChange={(checked) => onToggle(row.id, checked === true)} />
            </span>
            <Content column={columns[0]} value={row[columns[0].key]} primary locale={locale} />
          </div>
        </td>
      )}
      <Cells row={row} columns={columns} hidden={hidden} locale={locale} />
      <ActionCell rowId={row.id} label={hasActions ? fillLabel(copy.rowActions, { row: name }) : null} />
    </tr>
  );
});

const Cells = memo(function Cells({ row, columns, hidden, locale }: { row: RecordsTableRow; columns: ReadonlyArray<RecordsTableColumn>; hidden: ReadonlyArray<string>; locale: string }) {
  return (
    <>
      {columns.slice(1).map((column) => {
        const value = row[column.key];
        const type = columnType(column);
        return (
          <td
            key={column.key}
            data-slot="records-table-cell"
            className={cellClass(type)}
            data-col={column.key}
            data-value={!isBlank(value) && (type === "number" || type === "status") ? textOf(value) : undefined}
            hidden={hidden.includes(column.key)}
          >
            <Content column={column} value={value} locale={locale} />
          </td>
        );
      })}
    </>
  );
});

const ActionCell = memo(function ActionCell({ rowId, label }: { rowId: string; label: string | null }) {
  const api = useContext(RowMenuContext);
  return (
    <td data-slot="records-table-cell" className={ACTION_CELL}>
      {label !== null && api && (
        /* the menu's trigger props win over the tooltip's (data-scope, data-part), as on every hosted tooltip */
        <Tooltip content={label} {...api.getTriggerProps({ value: rowId })}>
          <TriggerButton at="row" aria-label={label} icon={<DotsThree data-slot="icon" weight="bold" />} />
        </Tooltip>
      )}
    </td>
  );
});

/* the primary column always reads as text */
function Content({ column, value, primary = false, locale }: { column: RecordsTableColumn; value: RecordsTableRow[string]; primary?: boolean; locale: string }) {
  if (isBlank(value)) return <span data-slot="records-table-blank" className={r.blank()}>—</span>;
  const type = primary ? "text" : columnType(column);
  if (type === "number") return <span data-slot="records-table-number" className={r.number()}>{formatNumber(value, locale)}</span>;
  if (type === "status") {
    const option = statusOption(column, value);
    return <span data-slot="records-table-status" className={r.status({ tone: option?.tone ?? "neutral" })}><span data-slot="records-table-dot" className={r.dot()} aria-hidden="true" />{option?.label ?? textOf(value)}</span>;
  }
  if (type === "tags") {
    const tags = Array.isArray(value) ? value : [textOf(value)];
    const more = tags.length - MAX_TAGS;
    return (
      <span data-slot="records-table-tags" className={r.tags()} title={tags.join(", ")}>
        {tags.slice(0, MAX_TAGS).map((tag, i) => <Tag key={i} tone={tagTone(tag, column)}>{tag}</Tag>)}
        {more > 0 && <Count variant="boxed">{`+${more}`}</Count>}
      </span>
    );
  }
  const text = textOf(value);
  if (type === "link") {
    return (
      <a data-slot="records-table-link" className={r.link()} href={linkHref(text)} target="_blank" rel="noreferrer" title={text}>
        <span data-slot="records-table-link-text" className={r.linkText()}>{text}</span><ArrowSquareOut data-slot="icon" weight="bold" aria-hidden="true" />
      </a>
    );
  }
  return <span data-slot="records-table-text" className={r.text()} title={text}>{text}</span>;
}
