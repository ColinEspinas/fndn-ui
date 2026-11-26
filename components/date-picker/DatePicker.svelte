<!-- A date field with a calendar in a popup. Behaviour by Ark UI (Zag date-picker). -->
<script lang="ts">
  import { DatePicker as ArkDatePicker, parseDate, type UseDatePickerContext } from "@ark-ui/svelte/date-picker";
  import { useLocaleContext } from "@ark-ui/svelte/locale";
  import { Portal } from "@ark-ui/svelte/portal";
  import CalendarBlankIcon from "phosphor-svelte/lib/CalendarBlankIcon";
  import CalendarViews, { calendarOptions, type CalendarOptions } from "../calendar/CalendarViews.svelte";
  import { datePicker } from "./date-picker.recipe";
  import { engineInputProps, formatDateText, parseDateText, type DateTextMode } from "./date-text";
  import { trackModality } from "../lib/modality";
  import { afterPaint } from "../lib/paint";
  import { untrack } from "svelte";

  export type DatePickerPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end";

  type Props = CalendarOptions & {
    /** Two-way bindable: <DatePicker bind:value />, the selected dates (ISO). Omit for uncontrolled (defaultValue). */
    value?: string[];
    defaultValue?: string[];
    onvaluechange?: (value: string[]) => void;
    onopenchange?: (open: boolean) => void;
    /** The calendar is open at mount, landed (no entrance) and without taking focus: an example or a page whose subject is the calendar. It closes as usual (Escape, a press outside, a choice). */
    defaultOpen?: boolean;
    /** Visible label. Without one, pass aria-label. */
    label?: string;
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
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    value = $bindable(), defaultValue, onvaluechange, onopenchange, defaultOpen = false, label, "aria-label": ariaLabel, placeholder, triggerLabel = "Choose date",
    size = "md", variant = "outline", invalid, required, name, placement = "bottom-start", class: className, style,
    selectionMode, min, max, unavailable, isDateUnavailable, defaultFocusedValue, startOfWeek, locale, timeZone, fixedWeeks, disabled, readOnly, ...data
  }: Props = $props();

  const id = $props.id();
  const options = $derived.by(() => {
    const engine = calendarOptions({ selectionMode, min, max, unavailable, isDateUnavailable, defaultFocusedValue, startOfWeek, locale, timeZone, fixedWeeks, disabled, readOnly }, id, value, defaultValue, (next) => {
      value = next;
      onvaluechange?.(next);
    });
    /* the input is the trigger: Escape and a press outside hand focus back to it */
    return { ...engine, ids: { ...(engine.ids as object), trigger: `${id}input-0`, input: (index: number) => `${id}input-${index}` } };
  });
  const r = $derived(datePicker({ size, variant }));
  $effect(() => trackModality());
  /* open at mount: the calendar is simply there (nothing plays on first paint) */
  let landing = $state(untrack(() => defaultOpen));
  $effect(() => (untrack(() => landing) ? afterPaint(() => { landing = false; }) : undefined));
  /* open at mount, the calendar keeps the side it was given until it first closes: the host
   * reserved room for it there, and a flip toward the viewport's roomier side would cover a
   * neighbour (an example above it) */
  let pinned = $state(untrack(() => defaultOpen));

  /* The field's text: the dates in words ("Mar 10 – 28, 2025", `date-text.ts`), typed over and read
   * back on Enter or when focus leaves; the engine keeps the value, the calendar and the focus. */
  type Api = ReturnType<UseDatePickerContext>;
  const localeContext = useLocaleContext();
  const textLocale = $derived(locale ?? localeContext().locale);
  const mode = $derived<DateTextMode>(selectionMode ?? "single");
  const placeholderText = $derived(placeholder ?? (mode === "range" ? "Select dates" : "Select date"));
  /* what is being typed; null while the field shows the value */
  let draft = $state<string | null>(null);
  const isos = (api: Api) => api.value.map((d) => d.toString());
  const interactive = (api: Api) => !api.disabled && !api.readOnly;

  /* the typed text becomes the value; false when it is not a date (the field shows the value again) */
  function commit(api: Api, text: string) {
    draft = null;
    const dates = parseDateText(text, textLocale, mode);
    if (dates === null) return false;
    const values = isos(api);
    if (!dates.length) { if (values.length) api.clearValue({ focus: false }); return true; }
    const next = dates.map((d) => parseDate(d));
    if (next.some((d) => api.isUnavailable(d))) return false;
    if (dates.join() !== values.join()) api.setValue(next);
    return true;
  }
  function oninput(api: Api, e: Event) {
    const text = (e.currentTarget as HTMLInputElement).value;
    draft = text;
    const dates = parseDateText(text, textLocale, mode);
    if (dates?.length) api.setFocusedValue(parseDate(dates[dates.length - 1]!));
  }
  function onkeydown(api: Api, e: KeyboardEvent) {
    if (!interactive(api) || e.isComposing) return;
    if (e.key === "Enter" && draft !== null) {
      e.preventDefault();
      commit(api, draft);
      if (api.open) api.setOpen(false);
    } else if (e.key === "Escape" && draft !== null) {
      e.preventDefault();
      e.stopPropagation();
      draft = null;
    } else if (e.key === "ArrowDown" && !api.open && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      e.preventDefault();
      api.setOpen(true);
    }
  }
  /* a tap opens the calendar without the keyboard; a tap while it is open is for typing */
  function onpointerdown(api: Api, e: PointerEvent) {
    if (e.pointerType !== "touch" || api.open || !interactive(api)) return;
    e.preventDefault();
    api.setOpen(true);
  }
</script>

<ArkDatePicker.Root
  {...data} {...options} data-slot="date-picker"
  class={r.base({ class: className })}
  {style}
  {invalid}
  {required}
  openOnClick
  {defaultOpen}
  onOpenChange={(details) => { if (!details.open) pinned = false; onopenchange?.(details.open); }}
  positioning={{ placement, gutter: 4, flip: !pinned }}
>
  {#if label}<ArkDatePicker.Label data-slot="date-picker-label" class={r.label()}>{label}</ArkDatePicker.Label>{/if}
  <ArkDatePicker.Control data-slot="date-picker-control" class={r.control()}>
    <ArkDatePicker.Context>
      {#snippet render(context)}
        {@const api = context()}
        <input
          {...engineInputProps(api.getInputProps({ index: 0 }) as Record<string, unknown>)}
          data-slot="date-picker-input"
          class={r.input()}
          dir="auto"
          role="combobox"
          aria-haspopup="dialog"
          aria-expanded={api.open}
          aria-controls={(api.getContentProps() as Record<string, unknown>).id as string}
          aria-label={ariaLabel}
          placeholder={placeholderText}
          value={draft ?? formatDateText(isos(api), textLocale, mode)}
          oninput={(e) => oninput(api, e)}
          onblur={() => { if (draft !== null) commit(api, draft); }}
          onkeydown={(e) => onkeydown(api, e)}
          onpointerdown={(e) => onpointerdown(api, e)}
        />
        {#if name}{#each isos(api) as v, i (i)}<input type="hidden" {name} value={v} />{/each}{/if}
      {/snippet}
    </ArkDatePicker.Context>
    <span data-slot="date-picker-icon" class={r.icon()} aria-hidden="true"><CalendarBlankIcon weight="bold" /></span>
  </ArkDatePicker.Control>
  <Portal>
    <ArkDatePicker.Positioner data-slot="date-picker-positioner" class={r.positioner()}>
      <ArkDatePicker.Content data-slot="date-picker-content" class={r.content({ landing })} aria-label={triggerLabel}>
        <CalendarViews {id} />
      </ArkDatePicker.Content>
    </ArkDatePicker.Positioner>
  </Portal>
</ArkDatePicker.Root>
