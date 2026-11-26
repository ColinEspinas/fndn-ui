<script lang="ts">
/* The options a calendar and a date picker share, and how they become the engine's props. Dates
 * are ISO strings ("2025-03-12"). */
import { parseDate, type DateValue } from "@ark-ui/vue/date-picker";

export type CalendarSelectionMode = "single" | "multiple" | "range";
type View = "day" | "month" | "year";

export type CalendarOptions = {
  /** single: one date. multiple: any number. range: a start and an end. */
  selectionMode?: CalendarSelectionMode;
  /** The earliest date that can be chosen. */
  min?: string;
  /** The latest date that can be chosen. */
  max?: string;
  /** Dates that cannot be chosen (holidays, booked days). */
  unavailable?: ReadonlyArray<string>;
  /** Called for each date shown; true makes it unavailable. */
  isDateUnavailable?: (date: string) => boolean;
  /** The date the calendar opens on (its month is shown, the keyboard starts there) when no
   * value is set. Without it: today. */
  defaultFocusedValue?: string;
  /** 0 Sunday … 6 Saturday. Without it: the locale's. */
  startOfWeek?: number;
  /** BCP 47 tag for month and weekday names and digits. Without it: the LocaleProvider's. */
  locale?: string;
  /** The time zone "today" is taken in. Without it: the browser's. */
  timeZone?: string;
  /** Always six weeks, so the grid keeps its height from month to month. */
  fixedWeeks?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
};

const toDates = (values: ReadonlyArray<string> | undefined): DateValue[] | undefined => (values ? values.map((v) => parseDate(v)) : undefined);
const toDate = (value: string | undefined): DateValue | undefined => (value ? parseDate(value) : undefined);
const localZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return undefined; }
};

/* the engine finds its triggers by id; the Tooltip around one takes the same id (triggerId) */
export const calendarIds = (id: string) => ({
  trigger: `${id}trigger`,
  prevTrigger: (view: View) => `${id}prev-${view}`,
  nextTrigger: (view: View) => `${id}next-${view}`,
});

/** The engine props a calendar and a date picker pass to their Ark root (v-bind). Undefined
 * options are left out, so the engine's defaults (and the LocaleProvider's locale) hold. */
export function calendarOptions(
  { selectionMode = "single", min, max, unavailable, isDateUnavailable, defaultFocusedValue, startOfWeek, locale, timeZone, fixedWeeks = true, disabled, readOnly }: CalendarOptions,
  id: string,
  value: ReadonlyArray<string> | undefined,
  defaultValue: ReadonlyArray<string> | undefined,
  onValueChange: (value: string[]) => void,
): Record<string, unknown> {
  const blocked = new Set(unavailable ?? []);
  const options: Record<string, unknown> = {
    ids: calendarIds(id),
    selectionMode,
    fixedWeeks,
    disabled,
    readOnly,
    modelValue: toDates(value),
    defaultValue: toDates(defaultValue),
    defaultFocusedValue: toDate(defaultFocusedValue),
    min: toDate(min),
    max: toDate(max),
    startOfWeek,
    locale,
    timeZone: timeZone ?? localZone(),
    isDateUnavailable: blocked.size || isDateUnavailable ? (date: DateValue) => blocked.has(date.toString()) || !!isDateUnavailable?.(date.toString()) : undefined,
    onValueChange: (details: { value: DateValue[] }) => onValueChange(details.value.map((d) => d.toString())),
  };
  for (const k of Object.keys(options)) if (options[k] === undefined) delete options[k];
  return options;
}
</script>

<script setup lang="ts">
/** The three views of a calendar (days, months, years), for an Ark date-picker root: the
 * Calendar renders them inline, the DatePicker inside its popup. */
import { DatePicker as ArkDatePicker, useDatePickerContext } from "@ark-ui/vue/date-picker";
import { PhCaretLeft, PhCaretRight } from "@phosphor-icons/vue";
import { computed } from "vue";
import Button from "../button/Button.vue";
import Tooltip from "../tooltip/Tooltip.vue";
import { calendar } from "./calendar.recipe";

const props = defineProps<{ /** The id the root's options were made with (calendarOptions). */ id: string }>();

const VIEWS = ["day", "month", "year"] as const;
const PREV = { day: "Previous month", month: "Previous year", year: "Previous decade" } as const;
const NEXT = { day: "Next month", month: "Next year", year: "Next decade" } as const;

const ids = computed(() => calendarIds(props.id));
const api = useDatePickerContext();
const r = calendar();
/* weekday names are never cut: where a locale's short names do not fit a 32px column (Arabic,
 * Tamil…), every column shows the narrow name */
const narrow = computed(() => api.value.weekDays.some((day) => [...day.short].length > 4));
const year = (n: number | undefined) => (n === undefined ? "" : api.value.format(api.value.focusedValue.set({ year: n }), { year: "numeric" }));
const titles = computed(() => {
  const decade = api.value.getDecade();
  return {
    day: api.value.visibleRangeText.start,
    month: api.value.format(api.value.focusedValue, { year: "numeric" }),
    year: `${year(decade.start)} – ${year(decade.end)}`,
  };
});
/* the month and year views: rows of four cells */
const grid = (view: "month" | "year") =>
  view === "month"
    ? api.value.getMonthsGrid({ columns: 4, format: "short" }).map((row) => row.map((m) => ({ value: m.value, label: m.label })))
    : api.value.getYearsGrid({ columns: 4 }).map((row) => row.map((y) => ({ value: y.value, label: year(y.value) })));
</script>

<template>
  <ArkDatePicker.View v-for="view in VIEWS" :key="view" :view="view" data-slot="calendar-view" :class="r.view()">
    <ArkDatePicker.ViewControl data-slot="calendar-header" :class="r.header()">
      <!-- the Tooltip wraps the engine's trigger (as in React), so the engine's disabled reaches the Button -->
      <Tooltip :content="PREV[view]" :trigger-id="ids.prevTrigger(view)">
        <ArkDatePicker.PrevTrigger as-child>
          <Button data-calendar="prev" :class="r.prev()" variant="ghost" size="sm" square muted :aria-label="PREV[view]">
            <template #icon><PhCaretLeft data-slot="icon" weight="bold" /></template>
          </Button>
        </ArkDatePicker.PrevTrigger>
      </Tooltip>
      <ArkDatePicker.ViewTrigger as-child>
        <Button data-calendar="title" :class="r.title()" variant="ghost" size="sm" :aria-label="titles[view]">{{ titles[view] }}</Button>
      </ArkDatePicker.ViewTrigger>
      <Tooltip :content="NEXT[view]" :trigger-id="ids.nextTrigger(view)">
        <ArkDatePicker.NextTrigger as-child>
          <Button data-calendar="next" :class="r.next()" variant="ghost" size="sm" square muted :aria-label="NEXT[view]">
            <template #icon><PhCaretRight data-slot="icon" weight="bold" /></template>
          </Button>
        </ArkDatePicker.NextTrigger>
      </Tooltip>
    </ArkDatePicker.ViewControl>
    <ArkDatePicker.Table v-if="view === 'day'" data-slot="calendar-grid" :class="r.grid()">
      <ArkDatePicker.TableHead data-slot="calendar-head" :class="r.head()">
        <ArkDatePicker.TableRow data-slot="calendar-row" :class="r.row()">
          <ArkDatePicker.TableHeader v-for="(day, i) in api.weekDays" :key="i" data-slot="calendar-weekday" :class="r.weekday()">{{ narrow ? day.narrow : day.short }}</ArkDatePicker.TableHeader>
        </ArkDatePicker.TableRow>
      </ArkDatePicker.TableHead>
      <ArkDatePicker.TableBody data-slot="calendar-body" :class="r.body()">
        <ArkDatePicker.TableRow v-for="(week, i) in api.weeks" :key="i" data-slot="calendar-row" :class="r.row()">
          <ArkDatePicker.TableCell v-for="day in week" :key="day.toString()" :value="day" data-slot="calendar-cell" :class="r.cell()">
            <ArkDatePicker.TableCellTrigger data-slot="calendar-cell-trigger" :class="r.cellTrigger()">{{ api.format(day, { day: "numeric" }) }}</ArkDatePicker.TableCellTrigger>
          </ArkDatePicker.TableCell>
        </ArkDatePicker.TableRow>
      </ArkDatePicker.TableBody>
    </ArkDatePicker.Table>
    <ArkDatePicker.Table v-else :columns="4" data-slot="calendar-grid" :class="r.grid()">
      <ArkDatePicker.TableBody data-slot="calendar-body" :class="r.body()">
        <ArkDatePicker.TableRow v-for="(cells, i) in grid(view)" :key="i" data-slot="calendar-row" :class="r.row()">
          <ArkDatePicker.TableCell v-for="cell in cells" :key="cell.value" :value="cell.value" data-slot="calendar-cell" :class="r.cell()">
            <ArkDatePicker.TableCellTrigger data-slot="calendar-cell-trigger" :class="r.cellTrigger()">{{ cell.label }}</ArkDatePicker.TableCellTrigger>
          </ArkDatePicker.TableCell>
        </ArkDatePicker.TableRow>
      </ArkDatePicker.TableBody>
    </ArkDatePicker.Table>
  </ArkDatePicker.View>
</template>
