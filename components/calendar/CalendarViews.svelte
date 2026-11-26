<!-- The three views of a calendar (days, months, years), for an Ark date-picker root: the Calendar
     renders them inline, the DatePicker inside its popup. -->
<script module lang="ts">
  /* The options a calendar and a date picker share, and how they become the engine's props. Dates
   * are ISO strings ("2025-03-12"). */
  import { parseDate, type DateValue } from "@ark-ui/svelte/date-picker";

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

  /** The engine props a calendar and a date picker spread on their Ark root. Undefined options are
   * left out, so the engine's defaults (and the LocaleProvider's locale) hold. */
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
      value: toDates(value),
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

<script lang="ts">
  import { DatePicker as ArkDatePicker, useDatePickerContext } from "@ark-ui/svelte/date-picker";
  import { mergeProps } from "@ark-ui/svelte/utils";
  import CaretLeft from "phosphor-svelte/lib/CaretLeftIcon";
  import CaretRight from "phosphor-svelte/lib/CaretRightIcon";
  import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";
  import Button from "../button/Button.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";
  import { calendar } from "./calendar.recipe";

  let { id }: { /** The id the root's options were made with (calendarOptions). */ id: string } = $props();

  const VIEWS = ["day", "month", "year"] as const;
  const PREV = { day: "Previous month", month: "Previous year", year: "Previous decade" } as const;
  const NEXT = { day: "Next month", month: "Next year", year: "Next decade" } as const;

  const ids = $derived(calendarIds(id));
  const api = useDatePickerContext();
  const r = calendar();
  /* weekday names are never cut: where a locale's short names do not fit a 32px column (Arabic,
   * Tamil…), every column shows the narrow name */
  const narrow = $derived(api().weekDays.some((day) => [...day.short].length > 4));
  const year = (n: number | undefined) => (n === undefined ? "" : api().format(api().focusedValue.set({ year: n }), { year: "numeric" }));
  const titles = $derived.by(() => {
    const decade = api().getDecade();
    return {
      day: api().visibleRangeText.start,
      month: api().format(api().focusedValue, { year: "numeric" }),
      year: `${year(decade.start)} – ${year(decade.end)}`,
    };
  });
  /* @ark-ui/svelte 5.25's TableCell drops the engine's cell props (role, aria-selected,
   * aria-current, data-*: it derives a function, not its result), so they are asked of the engine
   * here and passed on */
  const cellProps = (view: View, value: DateValue | number) =>
    view === "day" ? api().getDayTableCellProps({ value: value as DateValue })
    : view === "month" ? api().getMonthTableCellProps({ value: value as number })
    : api().getYearTableCellProps({ value: value as number });
  const withoutView = (props: HTMLAttributes<HTMLElement>) => {
    const { "data-view": _, ...rest } = props as HTMLAttributes<HTMLElement> & { "data-view"?: string };
    return rest;
  };
  /* @ark-ui/svelte 5.25's TableBody asks the engine for the day view's body props in every view;
   * the view's own are passed on */
  const bodyProps = (view: View) => api().getTableBodyProps({ view });
  /* the month and year views: rows of four cells */
  const grid = (view: "month" | "year") =>
    view === "month"
      ? api().getMonthsGrid({ columns: 4, format: "short" }).map((row) => row.map((m) => ({ value: m.value, label: m.label })))
      : api().getYearsGrid({ columns: 4 }).map((row) => row.map((y) => ({ value: y.value, label: year(y.value) })));
</script>

{#snippet caretLeft()}<CaretLeft data-slot="icon" weight="bold" />{/snippet}
{#snippet caretRight()}<CaretRight data-slot="icon" weight="bold" />{/snippet}

{#each VIEWS as view (view)}
    <!-- @ark-ui/svelte's View also writes data-view, which React's does not: left off, for the same DOM -->
  <ArkDatePicker.View {view}>
    {#snippet asChild(props)}
    <div {...withoutView(props())} data-slot="calendar-view" class={r.view()}>
    <ArkDatePicker.ViewControl data-slot="calendar-header" class={r.header()}>
      <!-- the Tooltip wraps the engine's trigger (as in React): the engine's props, its disabled
           among them, reach the Button, and the tooltip's are merged over them -->
      <Tooltip content={PREV[view]} triggerId={ids.prevTrigger(view)}>
        {#snippet trigger(tip)}
          <ArkDatePicker.PrevTrigger>
            {#snippet asChild(prev: () => HTMLButtonAttributes)}<Button {...mergeProps(prev(), tip())} data-calendar="prev" class={r.prev()} variant="ghost" size="sm" square muted aria-label={PREV[view]} icon={caretLeft} />{/snippet}
          </ArkDatePicker.PrevTrigger>
        {/snippet}
      </Tooltip>
      <ArkDatePicker.ViewTrigger>
        {#snippet asChild(props: () => HTMLButtonAttributes)}<Button {...props()} data-calendar="title" class={r.title()} variant="ghost" size="sm" aria-label={titles[view]}>{titles[view]}</Button>{/snippet}
      </ArkDatePicker.ViewTrigger>
      <Tooltip content={NEXT[view]} triggerId={ids.nextTrigger(view)}>
        {#snippet trigger(tip)}
          <ArkDatePicker.NextTrigger>
            {#snippet asChild(next: () => HTMLButtonAttributes)}<Button {...mergeProps(next(), tip())} data-calendar="next" class={r.next()} variant="ghost" size="sm" square muted aria-label={NEXT[view]} icon={caretRight} />{/snippet}
          </ArkDatePicker.NextTrigger>
        {/snippet}
      </Tooltip>
    </ArkDatePicker.ViewControl>
    {#if view === "day"}
      <ArkDatePicker.Table data-slot="calendar-grid" class={r.grid()}>
        <ArkDatePicker.TableHead data-slot="calendar-head" class={r.head()}>
          <ArkDatePicker.TableRow data-slot="calendar-row" class={r.row()}>
            {#each api().weekDays as day, i (i)}<ArkDatePicker.TableHeader data-slot="calendar-weekday" class={r.weekday()}>{narrow ? day.narrow : day.short}</ArkDatePicker.TableHeader>{/each}
          </ArkDatePicker.TableRow>
        </ArkDatePicker.TableHead>
        <ArkDatePicker.TableBody {...bodyProps(view)} data-slot="calendar-body" class={r.body()}>
          {#each api().weeks as week, i (i)}
            <ArkDatePicker.TableRow data-slot="calendar-row" class={r.row()}>
              {#each week as day (day.toString())}
                <ArkDatePicker.TableCell {...cellProps("day", day)} value={day} data-slot="calendar-cell" class={r.cell()}>
                  <ArkDatePicker.TableCellTrigger data-slot="calendar-cell-trigger" class={r.cellTrigger()}>{api().format(day, { day: "numeric" })}</ArkDatePicker.TableCellTrigger>
                </ArkDatePicker.TableCell>
              {/each}
            </ArkDatePicker.TableRow>
          {/each}
        </ArkDatePicker.TableBody>
      </ArkDatePicker.Table>
    {:else}
      <ArkDatePicker.Table columns={4} data-slot="calendar-grid" class={r.grid()}>
        <ArkDatePicker.TableBody {...bodyProps(view)} data-slot="calendar-body" class={r.body()}>
          {#each grid(view) as cells, i (i)}
            <ArkDatePicker.TableRow data-slot="calendar-row" class={r.row()}>
              {#each cells as cell (cell.value)}
                <ArkDatePicker.TableCell {...cellProps(view, cell.value)} value={cell.value} data-slot="calendar-cell" class={r.cell()}>
                  <ArkDatePicker.TableCellTrigger data-slot="calendar-cell-trigger" class={r.cellTrigger()}>{cell.label}</ArkDatePicker.TableCellTrigger>
                </ArkDatePicker.TableCell>
              {/each}
            </ArkDatePicker.TableRow>
          {/each}
        </ArkDatePicker.TableBody>
      </ArkDatePicker.Table>
    {/if}
    </div>
    {/snippet}
  </ArkDatePicker.View>
{/each}
