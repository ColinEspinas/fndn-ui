/* The issue list: status segments and an assignee filter over the issues; a row opens the issue,
 * its checkbox selects it, and a bulk bar (status, assignee, delete) opens under the toolbar while
 * rows are selected. Filters live here; the issues and the selection belong to the app.
 *
 * Desktop: Linear's and GitHub's list, a flush table of one-line rows (priority · ID · title ·
 * labels · status · assignee · due), no card, a hairline between rows; the title is the column that
 * gives way. The checkbox shows on a row's hover or focus, and on every row once one is picked.
 * Columns leave by the list's own width (container queries, so nothing is measured in script and
 * nothing reflows after the first paint): labels, then due, then assignee.
 * Phone: list rows (ID, status and assignee over the title); "Select" turns on the checkboxes. */
import { useState, type ReactNode } from "react";
import { DotsThree, Trash, User, Warning } from "@phosphor-icons/react";
import {
  AlertDialog, Avatar, Button, Checkbox, EmptyState, Link, Menu, ScrollArea, SegmentedControl, Select, StatusPill, Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow, Tag, Tooltip, type MenuEntry,
} from "@fndn/react";
import { ME, PEOPLE, STATUSES, overdue, personOf, priorityOf, shortDate, statusOf, toneOf, type Issue, type Priority, type Status } from "./data";

export type Filter = { segment: string; assignee: string };
/** Linear's default view: the work that is open. */
export const NO_FILTER: Filter = { segment: "active", assignee: "anyone" };

export type Bulk = { status: Status } | { assignee: string | null } | { remove: true };

const SEGMENTS: Record<string, (i: Issue) => boolean> = {
  active: (i) => i.status === "todo" || i.status === "progress" || i.status === "review",
  backlog: (i) => i.status === "backlog",
  done: (i) => i.status === "done",
  all: () => true,
};
const ANYONE = NO_FILTER.assignee;
const ASSIGNEES = [
  { value: ANYONE, label: "Anyone" },
  { value: "unassigned", label: "Unassigned" },
  ...PEOPLE.map((p) => ({ value: p.value, label: p.value === ME.value ? `${p.label} (you)` : p.label })),
];
const STATUS_MENU: MenuEntry[] = STATUSES.map((s) => ({ value: s.value, label: s.label }));
const ASSIGN_MENU: MenuEntry[] = [{ value: "unassigned", label: "Unassigned" }, { type: "separator" }, ...PEOPLE.map((p) => ({ value: p.value, label: p.label }))];

const issues = (n: number) => (n === 1 ? "1 issue" : `${n} issues`);

type Props = {
  issues: Issue[];
  /** What the list shows, for its name: "web-app", "All issues", "My issues". */
  scope: string;
  /** Kept by the app, so it survives the panel opening beside or instead of the list. */
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
  openId: string | null;
  onOpen: (id: string) => void;
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
  onBulk: (ids: string[], change: Bulk) => void;
  onNew: () => void;
  /** A phone: list rows instead of the table. */
  phone?: boolean;
  /** A control at the start of the toolbar (the project picker on a phone). */
  start?: ReactNode;
};

export function Issues({ issues: all, scope, filter: { segment, assignee }, onFilterChange, openId, onOpen, selected, onSelectedChange, onBulk, onNew, phone = false, start }: Props) {
  const setSegment = (v: string) => onFilterChange({ segment: v, assignee });
  const setAssignee = (v: string) => onFilterChange({ segment, assignee: v });
  const [confirm, setConfirm] = useState(false);
  /* a phone shows the checkboxes only in select mode (there is no hover to reveal them) */
  const [selecting, setSelecting] = useState(false);

  const byAssignee = (i: Issue) => assignee === ANYONE || (assignee === "unassigned" ? i.assignee === null : i.assignee === assignee);
  const shown = all.filter((i) => byAssignee(i) && SEGMENTS[segment]!(i));
  const count = (key: string) => all.filter((i) => byAssignee(i) && SEGMENTS[key]!(i)).length;

  /* only rows on screen stay selected: a filter that hides a row drops it from the bulk action */
  const picked = selected.filter((id) => shown.some((i) => i.id === id));
  const allPicked = shown.length > 0 && picked.length === shown.length ? true : picked.length ? "indeterminate" : false;
  const toggle = (id: string, on: boolean) => onSelectedChange(on ? [...picked, id] : picked.filter((x) => x !== id));
  const bulk = (change: Bulk) => { onBulk(picked, change); onSelectedChange([]); setSelecting(false); };
  const clearFilters = () => onFilterChange({ segment: "all", assignee: ANYONE });
  const stopSelecting = () => { onSelectedChange([]); setSelecting(false); };

  const segments = (
    <SegmentedControl
      size="sm" fill={phone} aria-label="Filter by status" value={segment} onValueChange={setSegment}
      options={[
        { value: "active", label: "Active", count: count("active") },
        { value: "backlog", label: "Backlog", count: count("backlog") },
        { value: "done", label: "Done", count: count("done") },
        { value: "all", label: "All", count: count("all") },
      ]}
    />
  );
  const assigneeFilter = (
    <Select size="sm" variant="ghost" aria-label="Assignee" items={ASSIGNEES} value={assignee} onValueChange={(v) => setAssignee(v ?? ANYONE)} />
  );

  return (
    <div className="@container flex h-full min-h-0 flex-col" data-app="issues">
      {phone ? (
        <div className="flex flex-col gap-2 px-3 pt-2 pb-2">
          <div className="flex items-center gap-1">
            {start}
            <span className="ms-auto" />
            {assigneeFilter}
            <Button variant="ghost" size="sm" onClick={() => (selecting ? stopSelecting() : setSelecting(true))} aria-pressed={selecting}>
              {selecting ? "Done" : "Select"}
            </Button>
          </div>
          {segments}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-2">
          {start}
          {segments}
          {assigneeFilter}
          {/* chrome, not content: the primary fill is kept for the dialog's "Create issue" */}
          <Button variant="outline" size="sm" className="ms-auto" aria-keyshortcuts="C" onClick={onNew}>
            New issue
          </Button>
        </div>
      )}

      {/* the bulk bar opens its row while rows are selected (instant from the keyboard) */}
      <div className={`grid kbd-instant motion-size-reveal ${picked.length ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`} inert={!picked.length}>
        <div className="min-h-0 overflow-hidden">
          <div className={`flex flex-wrap items-center gap-1 px-4 pb-2 kbd-instant motion-opacity-base max-sm:px-3 ${picked.length ? "opacity-100" : "opacity-0"}`} role="toolbar" aria-label="Selected issues" data-app="bulk">
            <span className="me-1 text-sm font-medium text-ink tabular-nums" role="status">{`${picked.length} selected`}</span>
            <Menu items={STATUS_MENU} triggerLabel="Status" onSelect={(v) => bulk({ status: v as Status })} />
            <Menu items={ASSIGN_MENU} triggerLabel="Assignee" onSelect={(v) => bulk({ assignee: v === "unassigned" ? null : v })} />
            {/* a phone has no room for four labels on one line: Delete, whose trash icon reads on its
              * own and whose dialog names what goes, becomes an icon at the far end, away from the
              * two menus that only move issues (Mail's and Linear's selection bars); the menus keep
              * their names */}
            {phone ? (
              <Tooltip content="Delete">
                <Button variant="ghost" size="sm" square className="ms-auto" aria-label="Delete" icon={<Trash data-slot="icon" weight="bold" />} onClick={() => setConfirm(true)} />
              </Tooltip>
            ) : (
              <Button variant="ghost" size="sm" icon={<Trash data-slot="icon" weight="bold" />} onClick={() => setConfirm(true)}>Delete</Button>
            )}
            {!phone &&<Button variant="ghost" size="sm" muted className="ms-auto" onClick={() => onSelectedChange([])}>Clear selection</Button>}
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1" aria-label={`Issues in ${scope}`}>
        {shown.length ? (
          phone ? (
            <ul className="flex flex-col border-t border-line-soft" aria-label={`Issues in ${scope}`}>
              {shown.map((issue) => (
                <PhoneRow key={issue.id} issue={issue} selecting={selecting} picked={picked.includes(issue.id)} onOpen={onOpen} onPick={toggle} />
              ))}
            </ul>
          ) : (
            <Table variant="flush" aria-label={`Issues in ${scope}`} data-picking={picked.length ? "" : undefined} className="group/list">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-0 pe-0 ps-4">
                    <Checkbox aria-label="Select all issues" checked={allPicked} onCheckedChange={(on) => onSelectedChange(on === true ? shown.map((i) => i.id) : [])} />
                  </TableHead>
                  <TableHead className="w-0 px-2"><span className="sr-only">Priority</span></TableHead>
                  <TableHead className="w-0 ps-0">ID</TableHead>
                  <TableHead truncate>Title</TableHead>
                  <TableHead className="hidden w-0 @4xl:table-cell"><span className="sr-only">Labels</span></TableHead>
                  <TableHead className="w-0">Status</TableHead>
                  <TableHead className="hidden w-0 pe-4 @xl:table-cell @2xl:pe-3"><span className="sr-only">Assignee</span></TableHead>
                  <TableHead numeric className="hidden w-0 pe-4 @2xl:table-cell">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((issue) => <Row key={issue.id} issue={issue} open={issue.id === openId} picked={picked.includes(issue.id)} onOpen={onOpen} onPick={toggle} />)}
              </TableBody>
            </Table>
          )
        ) : all.length ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12">
            <EmptyState size="block" icon="funnel" title="No issues match these filters" hint={`${issues(all.length)} in ${scope} are hidden by the status or assignee filter.`} />
            <Button size="sm" onClick={clearFilters}>Clear filters</Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-4 py-12">
            <EmptyState size="block" icon="folder-open" title={`No issues in ${scope} yet`} hint="Issues you create here show up in this list." />
            <Button size="sm" variant="primary" onClick={onNew}>New issue</Button>
          </div>
        )}
      </ScrollArea>

      <AlertDialog
        open={confirm} onOpenChange={setConfirm} tone="danger"
        title={`Delete ${issues(picked.length)}?`}
        description="They are removed for everyone in Northwind, with their comments and activity."
        actionLabel={`Delete ${issues(picked.length)}`}
        onAction={() => bulk({ remove: true })}
      />
    </div>
  );
}

/** Linear's priority mark: three bars, filled up to the priority; urgent is a warning; none is a
 * quiet ellipsis. The label is its name for assistive technology and its tooltip. */
export function PriorityMark({ priority }: { priority: Priority }) {
  const { label } = priorityOf(priority);
  const filled = priority === "high" ? 3 : priority === "medium" ? 2 : priority === "low" ? 1 : 0;
  return (
    <span role="img" aria-label={`Priority: ${label}`} title={label} className="flex size-4 shrink-0 items-center justify-center">
      {priority === "urgent" ? (
        <Warning weight="fill" className="size-4 text-orange" aria-hidden />
      ) : priority === "none" ? (
        <DotsThree weight="bold" className="size-4 text-ink-3" aria-hidden />
      ) : (
        <span className="flex h-3 items-end gap-0.5" aria-hidden>
          {[6, 9, 12].map((h, i) => <span key={h} className={`w-[3px] rounded-[1px] ${i < filled ? "bg-ink-2" : "bg-line-strong"}`} style={{ height: h }} />)}
        </span>
      )}
    </span>
  );
}

/** The assignee's avatar, or an empty circle; the name is its label and tooltip. 20px by default
 * (Linear's): in a list column a 24px coloured disc outweighs the issue titles. */
export function AssigneeMark({ id, size = "20" }: { id: string | null; size?: "20" | "24" }) {
  const person = personOf(id);
  if (person) return <span title={person.label} className="flex"><Avatar name={person.label} color={person.color} size={size} /></span>;
  return (
    <span role="img" aria-label="Unassigned" title="Unassigned" className={`flex items-center justify-center rounded-full border border-dashed border-line-strong text-ink-3 ${size === "24" ? "size-6" : "size-5"}`}>
      <User weight="bold" className="size-3" aria-hidden />
    </span>
  );
}

type RowProps = { issue: Issue; open: boolean; picked: boolean; onOpen: (id: string) => void; onPick: (id: string, on: boolean) => void };

/** One issue on one line: a click anywhere but the checkbox opens it; the title link is the
 * keyboard's way in (Enter). The open issue and picked rows are tinted, Linear's way. */
function Row({ issue, open, picked, onOpen, onPick }: RowProps) {
  const status = statusOf(issue.status);
  return (
    <TableRow onClick={() => onOpen(issue.id)} className={`group/row cursor-default ${picked ? "bg-accent-tint" : open ? "bg-hover" : ""}`} data-issue={issue.id}>
      <TableCell className="pe-0 ps-4" onClick={(e) => e.stopPropagation()}>
        {/* hidden until the row is hovered or focused, or any row is picked; always on a touch screen */}
        <span className="flex opacity-0 group-hover/row:opacity-100 group-data-picking/list:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
          <Checkbox aria-label={`Select ${issue.id}`} checked={picked} onCheckedChange={(on) => onPick(issue.id, on === true)} />
        </span>
      </TableCell>
      <TableCell className="px-2"><PriorityMark priority={issue.priority} /></TableCell>
      <TableCell className="ps-0 font-mono text-xs text-ink-2">{issue.id}</TableCell>
      <TableCell truncate>
        <Link
          href={`#${issue.id}`} variant="standalone" tone="neutral" aria-current={open || undefined}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(issue.id); }}
        >
          {issue.title}
        </Link>
      </TableCell>
      <TableCell className="hidden @4xl:table-cell">
        <span className="flex justify-end gap-1">{issue.labels.map((l) => <Tag key={l} size="sm" variant="outline" tone={toneOf(l)}>{l}</Tag>)}</span>
      </TableCell>
      <TableCell><StatusPill size="sm" tone={status.tone}>{status.label}</StatusPill></TableCell>
      <TableCell className="hidden pe-4 @xl:table-cell @2xl:pe-3"><AssigneeMark id={issue.assignee} /></TableCell>
      <TableCell numeric className={`hidden pe-4 @2xl:table-cell ${overdue(issue) ? "text-red" : issue.due ? "text-ink-2" : "text-ink-3"}`}>
        {issue.due ? shortDate(issue.due) : "—"}
      </TableCell>
    </TableRow>
  );
}

type PhoneRowProps = { issue: Issue; selecting: boolean; picked: boolean; onOpen: (id: string) => void; onPick: (id: string, on: boolean) => void };

/** A phone's list row: ID, status and assignee on the first line, the title whole under it. In
 * select mode a tap picks the row instead of opening it. */
function PhoneRow({ issue, selecting, picked, onOpen, onPick }: PhoneRowProps) {
  const status = statusOf(issue.status);
  return (
    <li className={`relative border-b border-line-soft ${picked ? "bg-accent-tint" : ""}`} data-issue={issue.id}>
      <div className="flex items-start gap-3 px-3 py-2.5" onClick={selecting ? () => onPick(issue.id, !picked) : undefined}>
        {selecting && (
          <span className="flex h-5 items-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox aria-label={`Select ${issue.id}`} checked={picked} onCheckedChange={(on) => onPick(issue.id, on === true)} />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2">
            <PriorityMark priority={issue.priority} />
            <span className="font-mono text-xs text-ink-2">{issue.id}</span>
            <span className="ms-auto flex items-center gap-2">
              <StatusPill size="sm" tone={status.tone}>{status.label}</StatusPill>
              <AssigneeMark id={issue.assignee} size="20" />
            </span>
          </span>
          {selecting ? (
            <span className="text-sm font-medium text-ink wrap-break-word [unicode-bidi:plaintext]">{issue.title}</span>
          ) : (
            <Link
              href={`#${issue.id}`} variant="standalone" tone="neutral" className="text-sm wrap-break-word [unicode-bidi:plaintext] after:absolute after:inset-0 after:content-['']"
              onClick={(e) => { e.preventDefault(); onOpen(issue.id); }}
            >
              {issue.title}
            </Link>
          )}
        </span>
      </div>
    </li>
  );
}
