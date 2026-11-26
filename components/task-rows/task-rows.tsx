"use client";
import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from "react";
import { ArrowCounterClockwise, Check, X } from "@phosphor-icons/react";
import { Collapsible } from "../collapsible/collapsible";
import { StatusPill } from "../status-pill/status-pill";
import { taskRows } from "./task-rows.recipe";

export type TaskDetail = { label: string; meta: string };
export type TaskRowStatus = "done" | "running" | "failed";
export type TaskRow = {
  key: string;
  label: string;
  amount: string;
  status: TaskRowStatus;
  /** step number shown inside the ring while running */
  step?: number;
  details: TaskDetail[];
};
export type TaskRowsLabels = { completed: string; failed: string; running: string };
const DEFAULT_LABELS: TaskRowsLabels = { completed: "Completed", failed: "Failed", running: "Running" };

export type TaskRowsProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  variant?: "capsules" | "list";
  rows: TaskRow[];
  /** Controlled set of expanded row keys. Omit for local state. */
  open?: string[];
  defaultOpen?: string[];
  onOpenChange?: (keys: string[]) => void;
  onToggleRow?: (key: string, open: boolean) => void;
  labels?: Partial<TaskRowsLabels>;
  /** Enter on mount: the rows present at mount fade up, staggered. Off by default; set it on the list your code adds live, never on one rendered from history or with the page. Rows added later enter either way. */
  appear?: boolean;
};

const R = 11;
const C = 2 * Math.PI * R;
const DASH = `${(C * 0.28).toFixed(2)} ${(C * 0.72).toFixed(2)}`;

/** Live agent task status, fully controlled. */
export function TaskRows({ variant = "capsules", rows, open, defaultOpen = [], onOpenChange, onToggleRow, labels, appear = false, className, ...rest }: TaskRowsProps) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const [inner, setInner] = useState<string[]>(defaultOpen);
  const openKeys = open ?? inner;
  const toggle = (key: string, isOpen: boolean) => {
    const next = isOpen ? [...openKeys.filter((k) => k !== key), key] : openKeys.filter((k) => k !== key);
    if (open === undefined) setInner(next);
    onOpenChange?.(next);
    onToggleRow?.(key, isOpen);
  };

  /* rows present at first render stagger in (with appear); a row that arrives later enters at once */
  const initial = useRef(new Set(rows.map((r) => r.key))).current;
  const entrance = useRef(appear).current;
  const order = useRef(rows.map((r) => r.key)).current;

  /* status swaps animate, first paint does not: the ready variant arms the entry transitions */
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const r = taskRows({ variant, ready });
  return (
    <div data-slot="task-rows" className={r.base({ class: className })} {...rest}>
      {rows.map((row) => (
        <Collapsible
          key={row.key}
          className={r.row({ appear: entrance || !initial.has(row.key) })}
          data-task-rows="row"
          variant="row"
          open={openKeys.includes(row.key)}
          onOpenChange={(isOpen) => toggle(row.key, isOpen)}
          style={initial.has(row.key) ? ({ "--fndn-row-index": order.indexOf(row.key) } as CSSProperties) : undefined}
          label={
            <>
              <span data-slot="task-rows-badge" className={r.badge()} aria-hidden>
                {row.status === "running" ? (
                  <span key="running" data-slot="task-rows-ring" className={r.ring()}>
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <circle data-slot="task-rows-ring-track" className={r.ringTrack()} cx="12" cy="12" r={R} fill="none" strokeWidth="2" />
                      <circle data-slot="task-rows-ring-arc" className={r.ringArc()} cx="12" cy="12" r={R} fill="none" strokeWidth="2" strokeLinecap="round" strokeDasharray={DASH} />
                    </svg>
                    <span data-slot="task-rows-step" className={r.step()}>{row.step}</span>
                  </span>
                ) : (
                  <span key={row.status} data-slot="task-rows-mark" className={r.mark({ tone: row.status === "failed" ? "red" : "green" })}>
                    {row.status === "failed" ? <X data-slot="icon" weight="bold" aria-hidden /> : <Check data-slot="icon" weight="bold" aria-hidden />}
                  </span>
                )}
              </span>
              <span data-slot="task-rows-label" className={r.label()} title={row.label}>{row.label}</span>
              <span data-slot="task-rows-status" className={r.status()} role="status">
                {row.status === "done" && <StatusPill key="done" tone="green" size="sm" dot={false}>{t.completed}</StatusPill>}
                {row.status === "failed" && (
                  <StatusPill key="failed" tone="red" size="sm" dot={false} trailingIcon={<ArrowCounterClockwise data-slot="icon" weight="bold" />}>{t.failed}</StatusPill>
                )}
                {row.status === "running" && <span key="running" className="sr-only">{t.running}</span>}
              </span>
              <span data-slot="task-rows-amount" className={r.amount()}>{row.amount}</span>
            </>
          }
        >
          <div data-slot="task-rows-detail-grid" className={r.detailGrid()}>
            <span data-slot="task-rows-rail" className={r.rail()} aria-hidden />
            <div data-slot="task-rows-detail-list" className={r.detailList()}>
              {row.details.map((d, j) => (
                <div key={j} data-slot="task-rows-detail" className={r.detail()}>
                  <span data-slot="task-rows-detail-label" className={r.detailLabel()} title={d.label}>{d.label}</span>
                  <span data-slot="task-rows-detail-meta" className={r.detailMeta()}>{d.meta}</span>
                </div>
              ))}
            </div>
          </div>
        </Collapsible>
      ))}
    </div>
  );
}
