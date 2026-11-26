"use client";
import { isValidElement, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { FileText, Image as ImageGlyph, MagnifyingGlass, PencilSimple, Sparkle, Terminal } from "@phosphor-icons/react";
import { Collapsible } from "../collapsible/collapsible";
import { HoverCard, type HoverCardLine } from "../hover-card/hover-card";
import { hoverCard } from "../hover-card/hover-card.recipe";
import { toolChips } from "./tool-chips.recipe";

/** Built-in tool glyphs by name. */
export type ToolChipsIconName = "think" | "write" | "run" | "read" | "image" | "search";
/** A step's icon: a built-in name, or any Phosphor icon (or other node). Defaults to "think". */
export type ToolChipsIcon = ToolChipsIconName | ReactNode;
export type ToolDetailLine = { text: string; tone?: "add" };
export type ToolStep = {
  /** Stable id; defaults to the label. Used by openRows. */
  key?: string;
  icon?: ToolChipsIcon;
  label: string;
  chip: string;
  mono?: boolean;
  detailMono?: boolean;
  detail: ToolDetailLine[];
};
/** A changed file. `lines` is the preview its hover-card shows. */
export type ToolDiff = { file: string; add: number; del: number; lines?: HoverCardLine[] };
export type ToolChipsLabels = { header: string; more: string };

const GLYPHS: Record<ToolChipsIconName, ReactNode> = {
  think: <Sparkle data-slot="icon" weight="fill" aria-hidden />,
  write: <PencilSimple data-slot="icon" weight="bold" aria-hidden />,
  run: <Terminal data-slot="icon" weight="bold" aria-hidden />,
  read: <FileText data-slot="icon" weight="bold" aria-hidden />,
  image: <ImageGlyph data-slot="icon" weight="bold" aria-hidden />,
  search: <MagnifyingGlass data-slot="icon" weight="bold" aria-hidden />,
};
const glyph = (icon: ToolChipsIcon | undefined) =>
  icon === undefined || icon === null ? GLYPHS.think : typeof icon === "string" ? (GLYPHS[icon as ToolChipsIconName] ?? GLYPHS.think) : isValidElement(icon) ? icon : GLYPHS.think;
const keyOf = (step: ToolStep) => step.key ?? step.label;

export type ToolChipsProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  steps?: ToolStep[];
  diffs?: ToolDiff[];
  /** Controlled run state. Omit for uncontrolled (defaultOpen). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Controlled keys (step.key ?? step.label) of expanded steps. Omit for local state. */
  openRows?: string[];
  defaultOpenRows?: string[];
  onOpenRowsChange?: (keys: string[]) => void;
  onToggleRow?: (label: string, open: boolean) => void;
  onDiffClick?: (file: string) => void;
  onMoreClick?: () => void;
  labels?: Partial<ToolChipsLabels>;
  /** Enter on mount: the steps present at mount fade up, staggered, then the diff row. Off by default; set it on the run your code adds live, never on one rendered from history or with the page. Steps and diffs added later enter either way. */
  appear?: boolean;
};

/** An agent run as compact rows with file-diff chips, fully controlled. */
export function ToolChips({
  steps = [], diffs = [], open, defaultOpen = true, onOpenChange, openRows, defaultOpenRows = [], onOpenRowsChange,
  onToggleRow, onDiffClick, onMoreClick, labels, appear = false, className, ...rest
}: ToolChipsProps) {
  const copy = { header: `${steps.length} tool call${steps.length === 1 ? "" : "s"}`, more: "", ...labels };
  const [inner, setInner] = useState(defaultOpen);
  const isOpen = open ?? inner;
  const [innerRows, setInnerRows] = useState<string[]>(defaultOpenRows);
  const expandedRows = openRows ?? innerRows;

  /* steps present at first render stagger in, the diff row one beat after them;
   * anything that arrives later enters at once */
  const initial = useRef({ steps: steps.length, diffs: diffs.length > 0, appear }).current;
  /* a step that arrives later opens its room as it fades (--fndn-row-room, read by the recipe) */
  const stagger = (i: number) => (i < initial.steps ? ({ "--fndn-row-index": i } as CSSProperties) : ({ "--fndn-row-room": "0fr" } as CSSProperties));

  const toggleRun = (n: boolean) => { if (open === undefined) setInner(n); onOpenChange?.(n); };
  const toggleRow = (step: ToolStep, n: boolean) => {
    const k = keyOf(step);
    const next = n ? [...expandedRows.filter((x) => x !== k), k] : expandedRows.filter((x) => x !== k);
    if (openRows === undefined) setInnerRows(next);
    onOpenRowsChange?.(next);
    onToggleRow?.(step.label, n);
  };
  const r = toolChips();
  const chip = (d: ToolDiff) => (
    <HoverCard
      title={d.file}
      add={d.add}
      del={d.del > 0 ? d.del : undefined}
      lines={d.lines}
      trigger={
        <button type="button" data-slot="tool-chips-diff" data-hover-card="trigger" className={hoverCard().trigger({ class: r.diff() })} onClick={() => onDiffClick?.(d.file)}>
          <span title={d.file}>{d.file}</span>
          <span data-slot="tool-chips-add" className={r.add()}>{`+${d.add}`}</span>
          {d.del > 0 && <span data-slot="tool-chips-del" className={r.del()}>{`−${d.del}`}</span>}
        </button>
      }
    />
  );
  return (
    <div data-slot="tool-chips" className={r.base({ class: className })} {...rest}>
      <Collapsible className={r.run()} data-tool-chips="run" variant="inline" caret="start" keepLayout open={isOpen} onOpenChange={toggleRun} label={copy.header}>
        <div data-slot="tool-chips-rows" className={r.rows()}>
          {steps.map((step, i) => (
            <Collapsible
              key={keyOf(step)}
              className={r.step({ appear: initial.appear || i >= initial.steps })}
              data-tool-chips="step"
              style={stagger(i)}
              variant="inline"
              caret="start"
              open={expandedRows.includes(keyOf(step))}
              onOpenChange={(n) => toggleRow(step, n)}
              label={
                <>
                  <span data-slot="tool-chips-icon" className={r.icon()} aria-hidden>{glyph(step.icon)}</span>
                  <span data-slot="tool-chips-label" className={r.label()} title={step.label}>{step.label}</span>
                  <span data-slot="tool-chips-value" className={r.value({ mono: !!step.mono })} title={step.chip}><span>{step.chip}</span></span>
                </>
              }
            >
              <div data-slot="tool-chips-lines" className={r.lines({ mono: !!step.detailMono })}>
                {step.detail.map((line, j) => (
                  <span key={j} data-slot="tool-chips-line" className={r.line({ tone: line.tone })} title={line.text}>{line.text}</span>
                ))}
              </div>
            </Collapsible>
          ))}
        </div>
        {diffs.length > 0 && (
          <div data-slot="tool-chips-diffs" className={r.diffs({ appear: initial.appear || !initial.diffs })} style={initial.diffs ? ({ "--fndn-row-index": initial.steps } as CSSProperties) : undefined}>
            {diffs.map((d, i) => {
              const more = !!copy.more && i === diffs.length - 1;
              return (
                <span key={d.file} data-slot="tool-chips-file" className={r.file({ withMore: more })}>
                  {chip(d)}
                  {more ? <button type="button" data-slot="tool-chips-more" className={r.more()} onClick={onMoreClick}>{copy.more}</button> : null}
                </span>
              );
            })}
          </div>
        )}
      </Collapsible>
    </div>
  );
}
