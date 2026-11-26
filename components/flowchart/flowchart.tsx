"use client";
import { CaretDown, Database, DotsSixVertical, Lightning, Plus } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import {
  addCondition, applyRowAction, choicesOf, flowchartLabels, focusAfter, handleLabel, joinerOf, propertyLabel, revealRow, rowActions,
  setProperty, setValue, valueLabel,
  type FlowchartChoices, type FlowchartCondition, type FlowchartLabels, type FlowchartOption, type FlowchartTrigger, type Focus, type RowAction,
} from "./flowchart.logic";
import { Button } from "../button/button";
import { flowchart } from "./flowchart.recipe";
import { Tooltip } from "../tooltip/tooltip";
import { Menu, type MenuEntry } from "../menu/menu";
import { Select } from "../select/select";

export type { FlowchartChoices, FlowchartCondition, FlowchartLabels, FlowchartOption, FlowchartTrigger } from "./flowchart.logic";

export type FlowchartProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** What can start the workflow. */
  triggers: ReadonlyArray<FlowchartTrigger>;
  /** Controlled trigger value. Omit for uncontrolled (use defaultTrigger). */
  trigger?: string;
  defaultTrigger?: string;
  onTriggerChange?: (value: string) => void;
  /** Name of the record the conditions read. */
  source?: string;
  /** Properties a condition can test. */
  properties: ReadonlyArray<FlowchartOption>;
  /** Values per property. */
  choices: FlowchartChoices;
  /** Controlled If / Else rows. Omit for uncontrolled (use defaultConditions). */
  conditions?: ReadonlyArray<FlowchartCondition>;
  defaultConditions?: ReadonlyArray<FlowchartCondition>;
  onConditionsChange?: (conditions: FlowchartCondition[]) => void;
  /** The fixed strings ({n} is a row's number); the rest stays English. */
  labels?: Partial<FlowchartLabels>;
};

/** An agent workflow: a trigger and If / Else conditions. */
export function Flowchart({
  triggers, trigger, defaultTrigger, onTriggerChange, source = "record", properties, choices,
  conditions, defaultConditions, onConditionsChange, labels, className, ...rest
}: FlowchartProps) {
  const t = flowchartLabels(labels);
  const r = flowchart();
  const root = useRef<HTMLDivElement>(null);
  const [innerTrigger, setInnerTrigger] = useState(defaultTrigger ?? triggers[0]?.value ?? "");
  const [innerConditions, setInnerConditions] = useState<ReadonlyArray<FlowchartCondition>>(defaultConditions ?? []);
  const current = trigger ?? innerTrigger;
  const list = conditions ?? innerConditions;
  const picked = triggers.find((t) => t.value === current);

  /* focus and the one-shot reveal run once the new list is on screen */
  const pending = useRef<{ focus: Focus; reveal?: number } | null>(null);
  useEffect(() => {
    const next = pending.current;
    if (!next || !root.current) return;
    pending.current = null;
    if (next.reveal !== undefined) revealRow(root.current, next.reveal);
    focusAfter(root.current, next.focus);
  }, [list]);

  const commit = (next: FlowchartCondition[], after?: { focus: Focus; reveal?: number }) => {
    pending.current = after ?? null;
    if (conditions === undefined) setInnerConditions(next);
    onConditionsChange?.(next);
  };
  const pickTrigger = (value: string) => {
    if (value === current) return;
    if (trigger === undefined) setInnerTrigger(value);
    onTriggerChange?.(value);
  };
  const act = (index: number, action: RowAction) => {
    const { next, focus } = applyRowAction(list, index, action);
    commit(next, { focus });
  };
  const addRow = () => {
    const { next, focus } = addCondition(list, properties, choices);
    commit(next, { focus, reveal: next.length - 1 });
  };
  const triggerItems: MenuEntry[] = [{ type: "radio-group", name: "trigger", value: current, closeOnSelect: true, items: triggers.map((t) => ({ value: t.value, label: t.label })) }];

  return (
    <div ref={root} data-slot="flowchart" className={r.base({ class: className })} {...rest}>
      <div data-slot="flowchart-node" className={r.node({ kind: "trigger" })}>
        <span data-slot="flowchart-kind" className={r.kind({ kind: "trigger" })}>{t.trigger}</span>
        <Menu items={triggerItems} onRadioChange={(_, value) => pickTrigger(value)}>
          <button data-menu="trigger" data-slot="flowchart-card" className={r.card({ kind: "trigger" })} type="button">
            <span data-slot="flowchart-icon" className={r.icon()} aria-hidden><Lightning data-slot="icon" weight="bold" /></span>
            <span data-slot="flowchart-text" className={r.text()}>
              <span data-slot="flowchart-title" className={r.title()}>{picked?.label ?? ""}</span>
              {picked?.caption && <span data-slot="flowchart-caption" className={r.caption()}>{picked.caption}</span>}
            </span>
            <span data-slot="flowchart-caret" className={r.caret()} aria-hidden><CaretDown data-slot="icon" weight="bold" /></span>
          </button>
        </Menu>
      </div>
      <div data-slot="flowchart-edge" className={r.edge()} aria-hidden />
      <div data-slot="flowchart-node" className={r.node({ kind: "condition" })}>
        <span data-slot="flowchart-kind" className={r.kind({ kind: "condition" })}>{t.condition}</span>
        <div data-slot="flowchart-card" className={r.card({ kind: "condition" })} role="group" aria-label={t.conditions}>
          <ol data-slot="flowchart-conditions" className={r.conditions()}>
            {list.map((c, i) => (
              <li key={c.id} data-slot="flowchart-row" className={r.row()}>
                <Menu items={rowActions(i, list.length, t) as MenuEntry[]} onSelect={(value) => act(i, value as RowAction)}>
                  <Tooltip content={handleLabel(i, t)}>
                    <button data-menu="trigger" data-slot="flowchart-handle" className={r.handle()} type="button" aria-label={handleLabel(i, t)}>
                      <DotsSixVertical data-slot="icon" weight="bold" />
                    </button>
                  </Tooltip>
                </Menu>
                <span data-slot="flowchart-joiner" className={r.joiner()}>{joinerOf(i, t)}</span>
                <span data-slot="flowchart-clause" className={r.clause()}>
                  <span data-slot="flowchart-source" className={r.source()} title={source}><span data-slot="flowchart-source-icon" className={r.sourceIcon()} aria-hidden><Database data-slot="icon" weight="bold" /></span><span data-slot="flowchart-source-text" className={r.sourceText()}>{source}</span></span>
                  <Select
                    items={properties}
                    value={c.property}
                    onValueChange={(value) => { if (value != null && value !== c.property) commit(setProperty(list, i, value, choices)); }}
                    size="sm"
                    variant="ghost"
                    aria-label={propertyLabel(i, t)}
                  />
                  <span data-slot="flowchart-operator" className={r.operator()}>{t.is}</span>
                  <Select
                    items={choicesOf(choices, c.property)}
                    value={c.value}
                    onValueChange={(value) => { if (value != null && value !== c.value) commit(setValue(list, i, value)); }}
                    size="sm"
                    variant="ghost"
                    aria-label={valueLabel(i, t)}
                  />
                </span>
              </li>
            ))}
          </ol>
          <Button data-flowchart="add" className={r.add()} variant="ghost" size="sm" icon={<Plus data-slot="icon" weight="bold" />} onClick={addRow}>{t.addCondition}</Button>
        </div>
      </div>
    </div>
  );
}
