<script setup lang="ts">
/** A month grid to pick a date, several dates or a range, shown inline. Behaviour by Ark UI (Zag date-picker). */
import { DatePicker as ArkDatePicker } from "@ark-ui/vue/date-picker";
import { computed, onMounted, useAttrs, useId } from "vue";
import CalendarViews, { calendarOptions, type CalendarSelectionMode } from "./CalendarViews.vue";
import { calendar } from "./calendar.recipe";
import { trackModality } from "../lib/modality";

/* the caller's class goes through the recipe; data-* land on the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    /** single: one date. multiple: any number. range: a start and an end. */
    selectionMode?: CalendarSelectionMode;
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
    /** BCP 47 tag for the names and digits. Without it: the LocaleProvider's. */
    locale?: string;
    /** Where "today" is taken. Without it: the browser's. */
    timeZone?: string;
    /** Always six weeks, so the grid keeps its height from month to month. */
    fixedWeeks?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    /** Names the calendar for assistive technology. */
    ariaLabel?: string;
    /** Uncontrolled: the dates selected at first (bind v-model:value to control them). */
    defaultValue?: ReadonlyArray<string>;
  }>(),
  { selectionMode: "single", fixedWeeks: true, disabled: undefined, readOnly: undefined },
);
/** v-model:value — the selected dates (ISO). Unbound: local state. */
const value = defineModel<string[] | undefined>("value", { default: undefined });
const emit = defineEmits<{ valueChange: [value: string[]] }>();

const id = useId();
const options = computed(() =>
  calendarOptions(props, id, value.value, props.defaultValue, (next) => {
    value.value = next;
    emit("valueChange", next);
  }),
);
const r = calendar();
onMounted(() => trackModality());
</script>

<template>
  <ArkDatePicker.Root v-bind="{ ...attrs, ...options }" inline data-slot="calendar" :class="r.base({ class: attrs.class as string | undefined })">
    <!-- the engine finds the focused date inside its content element, so the inline calendar has one too -->
    <ArkDatePicker.Content data-slot="calendar-content" :class="r.content()" :aria-label="ariaLabel">
      <CalendarViews :id="id" />
    </ArkDatePicker.Content>
  </ArkDatePicker.Root>
</template>
