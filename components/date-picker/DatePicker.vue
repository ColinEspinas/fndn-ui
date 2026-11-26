<script setup lang="ts">
/** A date field with a calendar in a popup. Behaviour by Ark UI (Zag date-picker). */
import { DatePicker as ArkDatePicker, parseDate, type UseDatePickerContext } from "@ark-ui/vue/date-picker";
import { useLocaleContext } from "@ark-ui/vue/locale";
import { PhCalendarBlank } from "@phosphor-icons/vue";
import { computed, onMounted, ref, useAttrs, useId, type UnwrapRef } from "vue";
import CalendarViews, { calendarOptions, type CalendarSelectionMode } from "../calendar/CalendarViews.vue";
import { datePicker } from "./date-picker.recipe";
import { engineInputProps, formatDateText, parseDateText, type DateTextMode } from "./date-text";
import { trackModality } from "../lib/modality";
import { afterPaint } from "../lib/paint";

export type DatePickerPlacement = "bottom-start" | "bottom" | "bottom-end" | "top-start" | "top" | "top-end";

/* the caller's class goes through the recipe; data-* land on the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** single: one date. multiple: any number. range: a start and an end, shown as one phrase; the calendar stays open until the end is chosen. */
    selectionMode?: CalendarSelectionMode;
    /** Visible label. Without one, pass aria-label. Or use the `label` slot. */
    label?: string;
    ariaLabel?: string;
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
    /** The earliest date that can be chosen (ISO). */
    min?: string;
    /** The latest date that can be chosen (ISO). */
    max?: string;
    /** Dates that cannot be chosen (ISO). */
    unavailable?: ReadonlyArray<string>;
    /** Called for each date shown; true makes it unavailable. */
    isDateUnavailable?: (date: string) => boolean;
    /** The date the calendar opens on when no value is set. Without it: today. */
    defaultFocusedValue?: string;
    /** 0 Sunday … 6 Saturday. Without it: the locale's. */
    startOfWeek?: number;
    /** BCP 47 tag for the field's format, the names and the digits. Without it: the LocaleProvider's. */
    locale?: string;
    /** Where "today" is taken. Without it: the browser's. */
    timeZone?: string;
    /** Always six weeks, so the grid keeps its height from month to month. */
    fixedWeeks?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    /** Uncontrolled: the dates selected at first (bind v-model:value to control them). */
    defaultValue?: ReadonlyArray<string>;
    /** The calendar is open at mount, landed (no entrance) and without taking focus: an example or a page whose subject is the calendar. It closes as usual (Escape, a press outside, a choice). */
    defaultOpen?: boolean;
  }>(),
  { selectionMode: "single", triggerLabel: "Choose date", size: "md", variant: "outline", invalid: false, required: false, placement: "bottom-start", fixedWeeks: true, disabled: undefined, readOnly: undefined, defaultOpen: false },
);
/** v-model:value — the selected dates (ISO). Unbound: local state. */
const value = defineModel<string[] | undefined>("value", { default: undefined });
const emit = defineEmits<{ valueChange: [value: string[]]; openChange: [open: boolean] }>();
defineSlots<{ label?: () => unknown }>();

const id = useId();
const options = computed(() => {
  const engine = calendarOptions(props, id, value.value, props.defaultValue, (next) => {
    value.value = next;
    emit("valueChange", next);
  });
  /* the input is the trigger: Escape and a press outside hand focus back to it */
  return { ...engine, ids: { ...(engine.ids as object), trigger: `${id}input-0`, input: (index: number) => `${id}input-${index}` } };
});
const r = computed(() => datePicker({ size: props.size, variant: props.variant }));
/* open at mount: the calendar is simply there (nothing plays on first paint) */
const landing = ref(props.defaultOpen);
onMounted(() => { if (landing.value) afterPaint(() => { landing.value = false; }); });
/* open at mount, the calendar keeps the side it was given until it first closes: the host
 * reserved room for it there, and a flip toward the viewport's roomier side would cover a
 * neighbour (an example above it) */
const pinned = ref(props.defaultOpen);
const positioning = computed(() => ({ placement: props.placement, gutter: 4, flip: !pinned.value }));
onMounted(() => trackModality());

/* The field's text: the dates in words ("Mar 10 – 28, 2025", `date-text.ts`), typed over and read
 * back on Enter or when focus leaves; the engine keeps the value, the calendar and the focus. */
type Api = UnwrapRef<UseDatePickerContext>;
const localeContext = useLocaleContext();
const locale = computed(() => props.locale ?? localeContext.value.locale);
const mode = computed<DateTextMode>(() => props.selectionMode ?? "single");
const placeholderText = computed(() => props.placeholder ?? (mode.value === "range" ? "Select dates" : "Select date"));
/* what is being typed; null while the field shows the value */
const draft = ref<string | null>(null);
const isos = (api: Api) => api.value.map((d) => d.toString());
const interactive = (api: Api) => !api.disabled && !api.readOnly;

/* the typed text becomes the value; false when it is not a date (the field shows the value again) */
function commit(api: Api, text: string) {
  draft.value = null;
  const dates = parseDateText(text, locale.value, mode.value);
  if (dates === null) return false;
  const values = isos(api);
  if (!dates.length) { if (values.length) api.clearValue({ focus: false }); return true; }
  const next = dates.map((d) => parseDate(d));
  if (next.some((d) => api.isUnavailable(d))) return false;
  if (dates.join() !== values.join()) api.setValue(next);
  return true;
}
function onInput(api: Api, e: Event) {
  const text = (e.target as HTMLInputElement).value;
  draft.value = text;
  const dates = parseDateText(text, locale.value, mode.value);
  if (dates?.length) api.setFocusedValue(parseDate(dates[dates.length - 1]!));
}
function onKeyDown(api: Api, e: KeyboardEvent) {
  if (!interactive(api) || e.isComposing) return;
  if (e.key === "Enter" && draft.value !== null) {
    e.preventDefault();
    commit(api, draft.value);
    if (api.open) api.setOpen(false);
  } else if (e.key === "Escape" && draft.value !== null) {
    e.preventDefault();
    e.stopPropagation();
    draft.value = null;
  } else if (e.key === "ArrowDown" && !api.open && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    e.preventDefault();
    api.setOpen(true);
  }
}
/* a tap opens the calendar without the keyboard; a tap while it is open is for typing */
function onPointerDown(api: Api, e: PointerEvent) {
  if (e.pointerType !== "touch" || api.open || !interactive(api)) return;
  e.preventDefault();
  api.setOpen(true);
}
</script>

<template>
  <ArkDatePicker.Root
    v-bind="{ ...attrs, ...options }"
    data-slot="date-picker"
    :class="r.base({ class: attrs.class as string | undefined })"
    :invalid="invalid"
    :required="required"
    open-on-click
    :default-open="defaultOpen"
    :positioning="positioning"
    @open-change="(details) => { if (!details.open) pinned = false; emit('openChange', details.open); }"
  >
    <ArkDatePicker.Label v-if="label || $slots.label" data-slot="date-picker-label" :class="r.label()"><slot name="label">{{ label }}</slot></ArkDatePicker.Label>
    <ArkDatePicker.Control data-slot="date-picker-control" :class="r.control()">
      <ArkDatePicker.Context v-slot="api">
        <input
          v-bind="engineInputProps(api.getInputProps({ index: 0 }) as Record<string, unknown>)"
          data-slot="date-picker-input"
          :class="r.input()"
          dir="auto"
          role="combobox"
          aria-haspopup="dialog"
          :aria-expanded="api.open"
          :aria-controls="(api.getContentProps() as Record<string, unknown>).id as string"
          :aria-label="ariaLabel"
          :placeholder="placeholderText"
          :value="draft ?? formatDateText(isos(api), locale, mode)"
          @input="onInput(api, $event)"
          @blur="draft !== null && commit(api, draft)"
          @keydown="onKeyDown(api, $event)"
          @pointerdown="onPointerDown(api, $event)"
        />
        <template v-if="name"><input v-for="(v, i) in isos(api)" :key="i" type="hidden" :name="name" :value="v" /></template>
      </ArkDatePicker.Context>
      <span data-slot="date-picker-icon" :class="r.icon()" aria-hidden="true"><PhCalendarBlank weight="bold" /></span>
    </ArkDatePicker.Control>
    <Teleport to="body">
      <ArkDatePicker.Positioner data-slot="date-picker-positioner" :class="r.positioner()">
        <ArkDatePicker.Content data-slot="date-picker-content" :class="r.content({ landing })" :aria-label="triggerLabel">
          <CalendarViews :id="id" />
        </ArkDatePicker.Content>
      </ArkDatePicker.Positioner>
    </Teleport>
  </ArkDatePicker.Root>
</template>
