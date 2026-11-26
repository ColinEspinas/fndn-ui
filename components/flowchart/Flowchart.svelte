<!-- An agent workflow: a trigger and If / Else conditions. -->
<script lang="ts">
  import CaretDown from "phosphor-svelte/lib/CaretDownIcon";
  import Database from "phosphor-svelte/lib/DatabaseIcon";
  import DotsSixVertical from "phosphor-svelte/lib/DotsSixVerticalIcon";
  import Lightning from "phosphor-svelte/lib/LightningIcon";
  import Plus from "phosphor-svelte/lib/PlusIcon";
  import { tick } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import {
    addCondition, applyRowAction, choicesOf, flowchartLabels, focusAfter, handleLabel, joinerOf, propertyLabel, revealRow, rowActions,
    setProperty, setValue, valueLabel,
    type FlowchartChoices, type FlowchartCondition, type FlowchartLabels, type FlowchartOption, type FlowchartTrigger, type Focus, type RowAction,
  } from "./flowchart.logic";
  import Button from "../button/Button.svelte";
  import { flowchart } from "./flowchart.recipe";
  import Menu, { type MenuEntry } from "../menu/Menu.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import Select from "../select/Select.svelte";

  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    /** What can start the workflow. */
    triggers: ReadonlyArray<FlowchartTrigger>;
    /** Two-way bindable: <Flowchart bind:trigger /> */
    trigger?: string;
    ontriggerchange?: (value: string) => void;
    /** Name of the record the conditions read. */
    source?: string;
    /** Properties a condition can test. */
    properties: ReadonlyArray<FlowchartOption>;
    /** Values per property. */
    choices: FlowchartChoices;
    /** Two-way bindable: <Flowchart bind:conditions /> */
    conditions?: ReadonlyArray<FlowchartCondition>;
    onconditionschange?: (conditions: FlowchartCondition[]) => void;
    /** The fixed strings ({n} is a row's number); the rest stays English. */
    labels?: Partial<FlowchartLabels>;
  };

  let {
    triggers, trigger: chosen = $bindable(), ontriggerchange, source = "record", properties, choices,
    conditions = $bindable([]), onconditionschange, labels, class: className, ...rest
  }: Props = $props();
  const t = $derived(flowchartLabels(labels));
  const r = flowchart();

  let root = $state<HTMLElement | null>(null);
  const current = $derived(chosen ?? triggers[0]?.value ?? "");
  const picked = $derived(triggers.find((t) => t.value === current));
  const list = $derived(conditions ?? []);
  const triggerItems = $derived<MenuEntry[]>([
    { type: "radio-group", name: "trigger", value: current, closeOnSelect: true, items: triggers.map((t) => ({ value: t.value, label: t.label })) },
  ]);

  /* focus and the one-shot reveal run once the new list is on screen */
  async function commit(next: FlowchartCondition[], after?: { focus: Focus; reveal?: number }) {
    conditions = next;
    onconditionschange?.(next);
    if (!after) return;
    await tick();
    if (!root) return;
    if (after.reveal !== undefined) revealRow(root, after.reveal);
    focusAfter(root, after.focus);
  }
  function pickTrigger(value: string) {
    if (value === current) return;
    chosen = value;
    ontriggerchange?.(value);
  }
  function act(index: number, action: string) {
    const { next, focus } = applyRowAction(list, index, action as RowAction);
    void commit(next, { focus });
  }
  function addRow() {
    const { next, focus } = addCondition(list, properties, choices);
    void commit(next, { focus, reveal: next.length - 1 });
  }
</script>

<div bind:this={root} data-slot="flowchart" class={r.base({ class: className as string | undefined })} {...rest}>
  <div data-slot="flowchart-node" class={r.node({ kind: "trigger" })}>
    <span data-slot="flowchart-kind" class={r.kind({ kind: "trigger" })}>{t.trigger}</span>
    <Menu items={triggerItems} onradiochange={(_name, value) => pickTrigger(value)}>
      {#snippet trigger(props)}
        <button {...props()} data-menu="trigger" data-slot="flowchart-card" class={r.card({ kind: "trigger" })} type="button">
          <span data-slot="flowchart-icon" class={r.icon()} aria-hidden="true"><Lightning data-slot="icon" weight="bold" /></span>
          <span data-slot="flowchart-text" class={r.text()}>
            <span data-slot="flowchart-title" class={r.title()}>{picked?.label ?? ""}</span>
            {#if picked?.caption}<span data-slot="flowchart-caption" class={r.caption()}>{picked.caption}</span>{/if}
          </span>
          <span data-slot="flowchart-caret" class={r.caret()} aria-hidden="true"><CaretDown data-slot="icon" weight="bold" /></span>
        </button>
      {/snippet}
    </Menu>
  </div>
  <div data-slot="flowchart-edge" class={r.edge()} aria-hidden="true"></div>
  <div data-slot="flowchart-node" class={r.node({ kind: "condition" })}>
    <span data-slot="flowchart-kind" class={r.kind({ kind: "condition" })}>{t.condition}</span>
    <div data-slot="flowchart-card" class={r.card({ kind: "condition" })} role="group" aria-label={t.conditions}>
      <ol data-slot="flowchart-conditions" class={r.conditions()}>
        {#each list as c, i (c.id)}
          <li data-slot="flowchart-row" class={r.row()}>
            <Menu items={rowActions(i, list.length, t) as MenuEntry[]} onselect={(value) => act(i, value)}>
              {#snippet trigger(menuProps)}
                <Tooltip content={handleLabel(i, t)} triggerId={menuProps().id ?? undefined}>
                  {#snippet trigger(tipProps)}
                    <button {...mergeProps(tipProps(), menuProps())} data-menu="trigger" data-slot="flowchart-handle" class={r.handle()} type="button" aria-label={handleLabel(i, t)}>
                      <DotsSixVertical data-slot="icon" weight="bold" />
                    </button>
                  {/snippet}
                </Tooltip>
              {/snippet}
            </Menu>
            <span data-slot="flowchart-joiner" class={r.joiner()}>{joinerOf(i, t)}</span>
            <span data-slot="flowchart-clause" class={r.clause()}>
              <span data-slot="flowchart-source" class={r.source()} title={source}><span data-slot="flowchart-source-icon" class={r.sourceIcon()} aria-hidden="true"><Database data-slot="icon" weight="bold" /></span><span data-slot="flowchart-source-text" class={r.sourceText()}>{source}</span></span>
              <Select
                items={properties}
                value={c.property}
                onvaluechange={(value) => { if (value != null && value !== c.property) void commit(setProperty(list, i, value, choices)); }}
                size="sm"
                variant="ghost"
                aria-label={propertyLabel(i, t)}
              />
              <span data-slot="flowchart-operator" class={r.operator()}>{t.is}</span>
              <Select
                items={choicesOf(choices, c.property)}
                value={c.value}
                onvaluechange={(value) => { if (value != null && value !== c.value) void commit(setValue(list, i, value)); }}
                size="sm"
                variant="ghost"
                aria-label={valueLabel(i, t)}
              />
            </span>
          </li>
        {/each}
      </ol>
      <Button data-flowchart="add" class={r.add()} variant="ghost" size="sm" onclick={addRow}>
        {#snippet icon()}<Plus data-slot="icon" weight="bold" />{/snippet}{t.addCondition}
      </Button>
    </div>
  </div>
</div>
