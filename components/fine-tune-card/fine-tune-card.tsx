"use client";
import { NumberInput } from "@ark-ui/react/number-input";
import { ArrowCounterClockwise, Check, Columns, Rows, Sparkle, SquaresFour } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "../button/button";
import { fineTuneCard } from "./fine-tune-card.recipe";
import { SegmentedControl } from "../segmented-control/segmented-control";
import { Select, type SelectItem } from "../select/select";
import { Shimmer } from "../shimmer/shimmer";
import {
  FINE_TUNE_FIELDS, FINE_TUNE_LAYOUTS, FINE_TUNE_TYPES, fieldValue, fineTuneLabels, focusAfterReset, isEdited, pageStep,
  type FineTuneField, type FineTuneLabels, type FineTuneLayout,
} from "./fine-tune-card.logic";
import { trackModality } from "../lib/modality";

export type { FineTuneField, FineTuneLabels, FineTuneLayout };

export type FineTuneCardProps = {
  /** The number properties, laid out in pairs. `value` is each field's default (what Reset returns to). */
  fields?: ReadonlyArray<FineTuneField>;
  /** Controlled values by field key. Omit for uncontrolled (use defaultValues). */
  values?: Record<string, number>;
  defaultValues?: Record<string, number>;
  onValuesChange?: (values: Record<string, number>) => void;
  /** Controlled layout. Omit for uncontrolled (use defaultLayout). */
  layout?: FineTuneLayout;
  defaultLayout?: FineTuneLayout;
  onLayoutChange?: (layout: FineTuneLayout) => void;
  /** Controlled type; null shows the placeholder. Omit for uncontrolled (use defaultType). */
  type?: string | null;
  defaultType?: string | null;
  onTypeChange?: (type: string | null) => void;
  /** Options of the type picker. Strings are accepted as value = label. */
  types?: ReadonlyArray<SelectItem | string>;
  /** Controlled edited state. Omit to follow the card (anything differs from where it started). */
  changed?: boolean;
  defaultChanged?: boolean;
  onChangedChange?: (changed: boolean) => void;
  onReset?: () => void;
  labels?: Partial<FineTuneLabels>;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

function useControllable<T>(value: T | undefined, initial: T, onChange?: (next: T) => void) {
  const [inner, setInner] = useState(initial);
  const controlled = value !== undefined;
  const current = controlled ? (value as T) : inner;
  const set = (next: T) => { if (!controlled) setInner(next); onChange?.(next); };
  return [current, set] as const;
}

const LAYOUT_ICON = { row: Columns, col: Rows, grid: SquaresFour } as const;

/** Compact inspector: layout, scrubbable number fields, type. Fields by Ark UI (Zag number-input). */
export function FineTuneCard({
  fields = FINE_TUNE_FIELDS, values: valuesProp, defaultValues, onValuesChange, layout: layoutProp, defaultLayout = "row", onLayoutChange,
  type: typeProp, defaultType = null, onTypeChange, types = FINE_TUNE_TYPES, changed: changedProp, defaultChanged, onChangedChange, onReset,
  labels, className, style, ...data
}: FineTuneCardProps) {
  const text = fineTuneLabels(labels);
  const r = fineTuneCard();
  const [values, setValues] = useControllable(valuesProp, defaultValues ?? {}, onValuesChange);
  const [layout, setLayout] = useControllable(layoutProp, defaultLayout, onLayoutChange);
  const [type, setType] = useControllable(typeProp, defaultType, onTypeChange);
  const initial = useRef({ layout, type });
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => trackModality(), []);

  /* uncontrolled, the edited state follows the card; every flip is reported */
  const derived = isEdited({ fields, values, layout, initialLayout: initial.current.layout, type, initialType: initial.current.type });
  const [innerChanged, setInnerChanged] = useState(defaultChanged);
  const changed = changedProp ?? innerChanged ?? derived;
  const last = useRef(derived);
  useEffect(() => {
    if (last.current === derived) return;
    last.current = derived;
    setInnerChanged(undefined);
    onChangedChange?.(derived);
  }, [derived]); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (key: string, next: number) => setValues({ ...values, [key]: next });
  const reset = () => {
    if (fields.some((f) => fieldValue(f, values) !== f.value)) setValues(Object.fromEntries(fields.map((f) => [f.key, f.value])));
    if (layout !== initial.current.layout) setLayout(initial.current.layout);
    if (type !== initial.current.type) setType(initial.current.type);
    onReset?.();
    focusAfterReset(root.current);
  };

  return (
    <div ref={root} {...data} data-slot="fine-tune-card" className={r.base({ class: className })} style={style}>
      <div data-slot="fine-tune-card-header" className={r.header()}>
        <span data-slot="fine-tune-card-title" className={r.title()} title={text.title}>{text.title}</span>
        <div data-slot="fine-tune-card-state" className={r.state()}>
          <span data-slot="fine-tune-card-hint" className={r.hint({ changed: changed })}>
            <span data-slot="fine-tune-card-hint-icon" className={r.hintIcon()} aria-hidden><Sparkle data-slot="icon" weight="fill" /></span>
            <Shimmer data-fine-tune-card="hint-text" className={r.hintText()} speed="fast" tone="accent">{text.adjust}</Shimmer>
          </span>
          <span data-slot="fine-tune-card-edited" className={r.edited({ changed: changed })}>
            <span data-slot="fine-tune-card-edited-text" className={r.editedText()}><Check data-slot="icon" weight="bold" aria-hidden />{text.edited}</span>
            <Button data-fine-tune-card="reset" className={r.reset()} variant="ghost" size="sm" icon={<ArrowCounterClockwise data-slot="icon" weight="bold" />} onClick={reset}>{text.reset}</Button>
          </span>
        </div>
        <span data-slot="fine-tune-card-status" className={r.status()} role="status">{changed ? text.edited : ""}</span>
      </div>
      <div data-slot="fine-tune-card-body" className={r.body()}>
        <span data-slot="fine-tune-card-section" className={r.section()}>{text.layout}</span>
        <SegmentedControl
          data-fine-tune-card="layout"
          className={r.layout()}
          size="xs"
          fill
          icons
          aria-label={text.layout}
          options={FINE_TUNE_LAYOUTS.map((value) => {
            const Icon = LAYOUT_ICON[value];
            return { value, label: text[value], icon: <Icon data-slot="icon" weight="bold" aria-hidden /> };
          })}
          value={layout}
          onValueChange={(next) => setLayout(next as FineTuneLayout)}
        />
        <div data-slot="fine-tune-card-fields" className={r.fields()}>
          {fields.map((f) => {
            const v = fieldValue(f, values);
            return (
              <NumberInput.Root
                key={f.key}
                data-slot="fine-tune-card-field" className={r.field({ changed: v !== f.value })}
                data-key={f.key}
                value={String(v)}
                min={f.min}
                max={f.max}
                step={f.step ?? 1}
                onValueChange={(details) => { if (Number.isFinite(details.valueAsNumber) && details.valueAsNumber !== v) setField(f.key, details.valueAsNumber); }}
              >
                <NumberInput.Scrubber data-slot="fine-tune-card-scrubber" className={r.scrubber()}>
                  <NumberInput.Label data-slot="fine-tune-card-field-label" className={r.fieldLabel()} title={f.label}>{f.label}</NumberInput.Label>
                </NumberInput.Scrubber>
                <NumberInput.Input
                  data-slot="fine-tune-card-input" className={r.input()}
                  onKeyDown={(event) => { const next = pageStep(event.nativeEvent, v, f); if (next != null && next !== v) setField(f.key, next); }}
                />
                {f.suffix && <span data-slot="fine-tune-card-suffix" className={r.suffix()}>{f.suffix}</span>}
              </NumberInput.Root>
            );
          })}
        </div>
      </div>
      <div data-slot="fine-tune-card-footer" className={r.footer()}>
        <span data-slot="fine-tune-card-footer-label" className={r.footerLabel()} title={text.type}>{text.type}</span>
        <Select data-fine-tune-card="type"
          className={r.type()}
          size="sm"
          variant="subtle"
          items={types}
          value={type}
          onValueChange={setType}
          placeholder={text.placeholder}
          placement="top-end"
          aria-label={text.type}
        />
      </div>
    </div>
  );
}
