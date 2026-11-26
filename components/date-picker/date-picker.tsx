"use client";
import { DatePicker as ArkDatePicker, parseDate, useDatePickerContext } from "@ark-ui/react/date-picker";
import { useLocaleContext } from "@ark-ui/react/locale";
import { Portal } from "@ark-ui/react/portal";
import { CalendarBlank } from "@phosphor-icons/react";
import { useEffect, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { engineInputProps, formatDateText, parseDateText, type DateTextMode } from "./date-text";
import { trackModality } from "../lib/modality";
import { afterPaint } from "../lib/paint";
import { CalendarViews, useCalendarOptions, type CalendarOptions } from "../calendar/calendar";
import { datePicker } from "./date-picker.recipe";

export type DatePickerPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end";

export type DatePickerProps = CalendarOptions & {
  /** Controlled selected dates (ISO strings, "2025-03-12"). Omit for uncontrolled (use defaultValue). */
  value?: ReadonlyArray<string>;
  defaultValue?: ReadonlyArray<string>;
  onValueChange?: (value: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  /** The calendar is open at mount, landed (no entrance) and without taking focus: an example or a
   * page whose subject is the calendar. It closes as usual (Escape, a press outside, a choice). */
  defaultOpen?: boolean;
  /** Visible label. Without one, pass aria-label. */
  label?: ReactNode;
  "aria-label"?: string;
  /** Shown while no date is chosen. Without it: "Select date" ("Select dates" for a range). */
  placeholder?: string;
  /** The name of the calendar popup for assistive technology. */
  triggerLabel?: string;
  /** The shared control's sizes, dimensions only: xs 24px, sm 28px, md 32px, lg 36px. */
  size?: "xs" | "sm" | "md" | "lg";
  /** The look, at every size: outline (the form field), subtle (the inspector), ghost (nothing until touched). */
  variant?: "outline" | "subtle" | "ghost";
  invalid?: boolean;
  required?: boolean;
  /** Form field name: one hidden input per date carries it, as an ISO date. */
  name?: string;
  placement?: DatePickerPlacement;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

/** A date field with a calendar in a popup. Behaviour by Ark UI (Zag date-picker). */
export function DatePicker({
  value, defaultValue, onValueChange, onOpenChange, defaultOpen = false, label, "aria-label": ariaLabel, placeholder, triggerLabel = "Choose date",
  size = "md", variant = "outline", invalid, required, name, placement = "bottom-start", className, style, ...rest
}: DatePickerProps) {
  const { selectionMode, min, max, unavailable, isDateUnavailable, defaultFocusedValue, startOfWeek, locale, timeZone, fixedWeeks, disabled, readOnly, ...data } = rest;
  useEffect(() => trackModality(), []);
  /* open at mount: the calendar is simply there (nothing plays on first paint) */
  const [landing, setLanding] = useState(defaultOpen);
  useEffect(() => (landing ? afterPaint(() => setLanding(false)) : undefined), []); // eslint-disable-line react-hooks/exhaustive-deps
  /* open at mount, the calendar keeps the side it was given until it first closes: the host
   * reserved room for it there, and a flip toward the viewport's roomier side would cover a
   * neighbour (an example above it) */
  const [pinned, setPinned] = useState(defaultOpen);
  const { options, id } = useCalendarOptions({ selectionMode, min, max, unavailable, isDateUnavailable, defaultFocusedValue, startOfWeek, locale, timeZone, fixedWeeks, disabled, readOnly }, value, defaultValue, onValueChange);
  const r = datePicker({ size, variant });
  const context = useLocaleContext();
  const mode: DateTextMode = selectionMode ?? "single";

  return (
    <ArkDatePicker.Root
      {...data} {...options} data-slot="date-picker"
      /* the input is the trigger: Escape and a press outside hand focus back to it */
      ids={{ ...(options.ids as object), trigger: `${id}input-0`, input: (index: number) => `${id}input-${index}` }}
      openOnClick
      defaultOpen={defaultOpen}
      className={r.base({ class: className })}
      style={style}
      invalid={invalid}
      required={required}
      onOpenChange={(details) => { if (!details.open) setPinned(false); onOpenChange?.(details.open); }}
      positioning={{ placement, gutter: 4, flip: !pinned }}
    >
      {label && <ArkDatePicker.Label data-slot="date-picker-label" className={r.label()}>{label}</ArkDatePicker.Label>}
      <ArkDatePicker.Control data-slot="date-picker-control" className={r.control()}>
        <DateText
          className={r.input()} locale={locale ?? context.locale} mode={mode} name={name} aria-label={ariaLabel}
          placeholder={placeholder ?? (mode === "range" ? "Select dates" : "Select date")}
        />
        <span data-slot="date-picker-icon" className={r.icon()} aria-hidden><CalendarBlank weight="bold" /></span>
      </ArkDatePicker.Control>
      <Portal>
        <ArkDatePicker.Positioner data-slot="date-picker-positioner" className={r.positioner()}>
          <ArkDatePicker.Content data-slot="date-picker-content" className={r.content({ landing })} aria-label={triggerLabel}>
            <CalendarViews id={id} />
          </ArkDatePicker.Content>
        </ArkDatePicker.Positioner>
      </Portal>
    </ArkDatePicker.Root>
  );
}

/** The field's text: the dates in words ("Mar 10 – 28, 2025", `date-text.ts`), typed over and read
 * back on Enter or when focus leaves; the engine keeps the value, the calendar and the focus. */
function DateText({ className, locale, mode, name, placeholder, "aria-label": ariaLabel }: {
  className: string; locale: string; mode: DateTextMode; name?: string; placeholder: string; "aria-label"?: string;
}) {
  const api = useDatePickerContext();
  /* what is being typed; null while the field shows the value */
  const [draft, setDraft] = useState<string | null>(null);
  const values = api.value.map((d) => d.toString());
  const interactive = !api.disabled && !api.readOnly;

  /* the typed text becomes the value; false when it is not a date (the field shows the value again) */
  const commit = (text: string) => {
    setDraft(null);
    const dates = parseDateText(text, locale, mode);
    if (dates === null) return false;
    if (!dates.length) { if (values.length) api.clearValue({ focus: false }); return true; }
    const next = dates.map((d) => parseDate(d));
    if (next.some((d) => api.isUnavailable(d))) return false;
    if (dates.join() !== values.join()) api.setValue(next);
    return true;
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!interactive || e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && draft !== null) {
      e.preventDefault();
      commit(draft);
      if (api.open) api.setOpen(false);
    } else if (e.key === "Escape" && draft !== null) {
      e.preventDefault();
      e.stopPropagation();
      setDraft(null);
    } else if (e.key === "ArrowDown" && !api.open && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      api.setOpen(true);
    }
  };

  return (
    <>
      <input
        {...engineInputProps(api.getInputProps({ index: 0 }) as Record<string, unknown>)}
        data-slot="date-picker-input"
        className={className}
        dir="auto"
        role="combobox"
        aria-haspopup="dialog"
        aria-expanded={api.open}
        aria-controls={api.getContentProps().id as string}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={draft ?? formatDateText(values, locale, mode)}
        onChange={(e) => {
          setDraft(e.target.value);
          const dates = parseDateText(e.target.value, locale, mode);
          if (dates?.length) api.setFocusedValue(parseDate(dates[dates.length - 1]!));
        }}
        onBlur={() => { if (draft !== null) commit(draft); }}
        onKeyDown={onKeyDown}
        /* a tap opens the calendar without the keyboard; a tap while it is open is for typing */
        onPointerDown={(e) => {
          if (e.pointerType !== "touch" || api.open || !interactive) return;
          e.preventDefault();
          api.setOpen(true);
        }}
      />
      {name && values.map((v, i) => <input key={i} type="hidden" name={name} value={v} />)}
    </>
  );
}
