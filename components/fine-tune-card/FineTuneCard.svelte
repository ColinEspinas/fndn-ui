<!-- Compact inspector: layout, scrubbable number fields, type. Fields by Ark UI (Zag number-input). -->
<script lang="ts">
  import { NumberInput } from "@ark-ui/svelte/number-input";
  import ArrowCounterClockwise from "phosphor-svelte/lib/ArrowCounterClockwiseIcon";
  import Check from "phosphor-svelte/lib/CheckIcon";
  import Columns from "phosphor-svelte/lib/ColumnsIcon";
  import Rows from "phosphor-svelte/lib/RowsIcon";
  import Sparkle from "phosphor-svelte/lib/SparkleIcon";
  import SquaresFour from "phosphor-svelte/lib/SquaresFourIcon";
  import { untrack } from "svelte";
  import Button from "../button/Button.svelte";
  import { fineTuneCard } from "./fine-tune-card.recipe";
  import SegmentedControl from "../segmented-control/SegmentedControl.svelte";
  import Select, { type SelectItem } from "../select/Select.svelte";
  import Shimmer from "../shimmer/Shimmer.svelte";
  import {
    FINE_TUNE_FIELDS, FINE_TUNE_LAYOUTS, FINE_TUNE_TYPES, fieldValue, fineTuneLabels, focusAfterReset, isEdited, pageStep,
    type FineTuneField, type FineTuneLabels, type FineTuneLayout,
  } from "./fine-tune-card.logic";
  import { trackModality } from "../lib/modality";

  export type { FineTuneField, FineTuneLabels, FineTuneLayout };

  type Props = {
    /** The number properties, laid out in pairs. `value` is each field's default (what Reset returns to). */
    fields?: ReadonlyArray<FineTuneField>;
    /** Two-way bindable: <FineTuneCard bind:values />. Values by field key. */
    values?: Record<string, number>;
    /** Two-way bindable: <FineTuneCard bind:layout />. */
    layout?: FineTuneLayout;
    /** Two-way bindable: <FineTuneCard bind:type />. null shows the placeholder. */
    type?: string | null;
    /** Options of the type picker. Strings are accepted as value = label. */
    types?: ReadonlyArray<SelectItem | string>;
    /** Two-way bindable. Unset, the edited state follows the card (anything differs from where it started). */
    changed?: boolean;
    onvalueschange?: (values: Record<string, number>) => void;
    onlayoutchange?: (layout: FineTuneLayout) => void;
    ontypechange?: (type: string | null) => void;
    onchangedchange?: (changed: boolean) => void;
    onreset?: () => void;
    labels?: Partial<FineTuneLabels>;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    fields = FINE_TUNE_FIELDS, values = $bindable({}), layout = $bindable("row"), type = $bindable(null), types = FINE_TUNE_TYPES,
    changed = $bindable(), onvalueschange, onlayoutchange, ontypechange, onchangedchange, onreset, labels, class: className, style, ...data
  }: Props = $props();

  const r = fineTuneCard();
  const text = $derived(fineTuneLabels(labels));
  const initial = untrack(() => ({ layout, type }));
  let root = $state<HTMLElement | null>(null);
  $effect(() => trackModality());

  const icons = { row: Columns, col: Rows, grid: SquaresFour } as const;
  const layoutOptions = $derived(FINE_TUNE_LAYOUTS.map((value) => ({ value, label: text[value] })));

  const edited = $derived(isEdited({ fields, values, layout, initialLayout: initial.layout, type, initialType: initial.type }));
  const isChanged = $derived(changed ?? edited);
  let last = untrack(() => edited);
  $effect(() => {
    const next = edited;
    if (next === last) return;
    last = next;
    untrack(() => { changed = next; onchangedchange?.(next); });
  });

  function setValues(next: Record<string, number>) { values = next; onvalueschange?.(next); }
  function setLayout(next: string) { layout = next as FineTuneLayout; onlayoutchange?.(layout); }
  function setType(next: string | null) { type = next; ontypechange?.(next); }
  function setField(key: string, next: number) { setValues({ ...values, [key]: next }); }
  function onValue(f: FineTuneField, n: number) { if (Number.isFinite(n) && n !== fieldValue(f, values)) setField(f.key, n); }
  function onPage(event: KeyboardEvent, f: FineTuneField) {
    const v = fieldValue(f, values);
    const next = pageStep(event, v, f);
    if (next != null && next !== v) setField(f.key, next);
  }
  function reset() {
    if (fields.some((f) => fieldValue(f, values) !== f.value)) setValues(Object.fromEntries(fields.map((f) => [f.key, f.value])));
    if (layout !== initial.layout) setLayout(initial.layout);
    if (type !== initial.type) setType(initial.type);
    onreset?.();
    focusAfterReset(root);
  }
</script>

<div bind:this={root} {...data} data-slot="fine-tune-card" class={r.base({ class: className })} {style}>
  <div data-slot="fine-tune-card-header" class={r.header()}>
    <span data-slot="fine-tune-card-title" class={r.title()} title={text.title}>{text.title}</span>
    <div data-slot="fine-tune-card-state" class={r.state()}>
      <span data-slot="fine-tune-card-hint" class={r.hint({ changed: isChanged })}><span data-slot="fine-tune-card-hint-icon" class={r.hintIcon()} aria-hidden="true"><Sparkle data-slot="icon" weight="fill" /></span><Shimmer data-fine-tune-card="hint-text" class={r.hintText()} speed="fast" tone="accent">{text.adjust}</Shimmer></span>
      <span data-slot="fine-tune-card-edited" class={r.edited({ changed: isChanged })}>
        <span data-slot="fine-tune-card-edited-text" class={r.editedText()}><Check data-slot="icon" weight="bold" aria-hidden="true" />{text.edited}</span>
        <Button data-fine-tune-card="reset" class={r.reset()} variant="ghost" size="sm" onclick={reset}>
          {#snippet icon()}<ArrowCounterClockwise data-slot="icon" weight="bold" />{/snippet}
          {text.reset}
        </Button>
      </span>
    </div>
    <span data-slot="fine-tune-card-status" class={r.status()} role="status">{isChanged ? text.edited : ""}</span>
  </div>
  <div data-slot="fine-tune-card-body" class={r.body()}>
    <span data-slot="fine-tune-card-section" class={r.section()}>{text.layout}</span>
    <SegmentedControl
      data-fine-tune-card="layout"
      class={r.layout()}
      size="xs"
      fill
      icons
      aria-label={text.layout}
      options={layoutOptions}
      value={layout}
      onvaluechange={setLayout}
    >
      {#snippet icon({ option })}
        {@const Icon = icons[option.value as FineTuneLayout]}
        <Icon data-slot="icon" weight="bold" aria-hidden="true" />
      {/snippet}
    </SegmentedControl>
    <div data-slot="fine-tune-card-fields" class={r.fields()}>
      {#each fields as f (f.key)}
        {@const v = fieldValue(f, values)}
        <NumberInput.Root
          data-slot="fine-tune-card-field" class={r.field({ changed: v !== f.value })}
          data-key={f.key}
          value={String(v)}
          min={f.min}
          max={f.max}
          step={f.step ?? 1}
          onValueChange={(details) => onValue(f, details.valueAsNumber)}
        >
          <NumberInput.Scrubber data-slot="fine-tune-card-scrubber" class={r.scrubber()}>
            <NumberInput.Label data-slot="fine-tune-card-field-label" class={r.fieldLabel()} title={f.label}>{f.label}</NumberInput.Label>
          </NumberInput.Scrubber>
          <NumberInput.Input data-slot="fine-tune-card-input" class={r.input()} onkeydown={(event: KeyboardEvent) => onPage(event, f)} />
          {#if f.suffix}<span data-slot="fine-tune-card-suffix" class={r.suffix()}>{f.suffix}</span>{/if}
        </NumberInput.Root>
      {/each}
    </div>
  </div>
  <div data-slot="fine-tune-card-footer" class={r.footer()}>
    <span data-slot="fine-tune-card-footer-label" class={r.footerLabel()} title={text.type}>{text.type}</span>
    <Select data-fine-tune-card="type"
      class={r.type()}
      size="sm"
      variant="subtle"
      items={types}
      value={type}
      onvaluechange={setType}
      placeholder={text.placeholder}
      placement="top-end"
      aria-label={text.type}
    />
  </div>
</div>
