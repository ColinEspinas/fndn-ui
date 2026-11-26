"use client";
import { DatePicker as ArkDatePicker, parseDate, useDatePickerContext, type DateValue } from "@ark-ui/react/date-picker";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useEffect, useId, useMemo, type CSSProperties } from "react";
import { trackModality } from "../lib/modality";
import { Button } from "../button/button";
import { calendar } from "./calendar.recipe";
import { Tooltip } from "../tooltip/tooltip";

export type CalendarSelectionMode = "single" | "multiple" | "range";

/** The engine options a calendar and a date picker share. Dates are ISO strings ("2025-03-12"). */
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

export type CalendarProps = CalendarOptions & {
  /** Controlled selected dates (ISO). Omit for uncontrolled (use defaultValue). */
  value?: ReadonlyArray<string>;
  defaultValue?: ReadonlyArray<string>;
  onValueChange?: (value: string[]) => void;
  /** Names the calendar for assistive technology. */
  "aria-label"?: string;
  className?: string;
  style?: CSSProperties;
  /** Forwarded to the root (a host marks it data-<block>="<part>"). */
  [data: `data-${string}`]: string | undefined;
};

const toDates = (values: ReadonlyArray<string> | undefined): DateValue[] | undefined => (values ? values.map((v) => parseDate(v)) : undefined);
const toDate = (value: string | undefined): DateValue | undefined => (value ? parseDate(value) : undefined);
const localZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return undefined; }
};

/** The engine props a calendar and a date picker pass to their Ark root. Undefined options are
 * left out, so the engine's defaults (and the LocaleProvider's locale) hold. */
export function useCalendarOptions(
  { selectionMode = "single", min, max, unavailable, isDateUnavailable, defaultFocusedValue, startOfWeek, locale, timeZone, fixedWeeks = true, disabled, readOnly }: CalendarOptions,
  value: ReadonlyArray<string> | undefined,
  defaultValue: ReadonlyArray<string> | undefined,
  onValueChange: ((value: string[]) => void) | undefined,
) {
  const blocked = useMemo(() => new Set(unavailable ?? []), [unavailable]);
  const zone = useMemo(() => timeZone ?? localZone(), [timeZone]);
  /* the engine finds its triggers by id; a Tooltip wrapping one would give it the tooltip's id,
   * so the ids are set here and handed to the Tooltips (triggerId) */
  const id = useId();
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
    timeZone: zone,
    isDateUnavailable: blocked.size || isDateUnavailable ? (date: DateValue) => blocked.has(date.toString()) || !!isDateUnavailable?.(date.toString()) : undefined,
    onValueChange: (details: { value: DateValue[] }) => onValueChange?.(details.value.map((d) => d.toString())),
  };
  for (const k of Object.keys(options)) if (options[k] === undefined) delete options[k];
  return { options, id };
}

type View = "day" | "month" | "year";
const calendarIds = (id: string) => ({
  trigger: `${id}trigger`,
  prevTrigger: (view: View) => `${id}prev-${view}`,
  nextTrigger: (view: View) => `${id}next-${view}`,
});

const PREV = { day: "Previous month", month: "Previous year", year: "Previous decade" } as const;
const NEXT = { day: "Next month", month: "Next year", year: "Next decade" } as const;

/** The three views of a calendar (days, months, years), for an Ark date-picker root: the
 * Calendar renders them inline, the DatePicker inside its popup. */
export function CalendarViews({ id }: { /** The id the root's options were made with (useCalendarOptions). */ id: string }) {
  const ids = calendarIds(id);
  const api = useDatePickerContext();
  const r = calendar();
  const decade = api.getDecade();
  /* weekday names are never cut: where a locale's short names do not fit a 32px column (Arabic,
   * Tamil…), every column shows the narrow name */
  const narrow = api.weekDays.some((day) => [...day.short].length > 4);
  const year = (n: number | undefined) => (n === undefined ? "" : api.format(api.focusedValue.set({ year: n }), { year: "numeric" }));
  const titles = {
    day: api.visibleRangeText.start,
    month: api.format(api.focusedValue, { year: "numeric" }),
    year: `${year(decade.start)} – ${year(decade.end)}`,
  };

  const header = (view: "day" | "month" | "year") => (
    <ArkDatePicker.ViewControl data-slot="calendar-header" className={r.header()}>
      {/* the Tooltip wraps the engine's trigger (not the other way round), so the engine's
       * disabled reaches the Button rather than the Tooltip's own disabled prop */}
      <Tooltip content={PREV[view]} triggerId={ids.prevTrigger(view)}>
        <ArkDatePicker.PrevTrigger asChild>
          <Button data-calendar="prev" className={r.prev()} variant="ghost" size="sm" square muted aria-label={PREV[view]} icon={<CaretLeft data-slot="icon" weight="bold" />} />
        </ArkDatePicker.PrevTrigger>
      </Tooltip>
      <ArkDatePicker.ViewTrigger asChild>
        <Button data-calendar="title" className={r.title()} variant="ghost" size="sm" aria-label={titles[view]}>{titles[view]}</Button>
      </ArkDatePicker.ViewTrigger>
      <Tooltip content={NEXT[view]} triggerId={ids.nextTrigger(view)}>
        <ArkDatePicker.NextTrigger asChild>
          <Button data-calendar="next" className={r.next()} variant="ghost" size="sm" square muted aria-label={NEXT[view]} icon={<CaretRight data-slot="icon" weight="bold" />} />
        </ArkDatePicker.NextTrigger>
      </Tooltip>
    </ArkDatePicker.ViewControl>
  );

  return (
    <>
      <ArkDatePicker.View view="day" data-slot="calendar-view" className={r.view()}>
        {header("day")}
        <ArkDatePicker.Table data-slot="calendar-grid" className={r.grid()}>
          <ArkDatePicker.TableHead data-slot="calendar-head" className={r.head()}>
            <ArkDatePicker.TableRow data-slot="calendar-row" className={r.row()}>
              {api.weekDays.map((day, i) => (
                <ArkDatePicker.TableHeader key={i} data-slot="calendar-weekday" className={r.weekday()}>{narrow ? day.narrow : day.short}</ArkDatePicker.TableHeader>
              ))}
            </ArkDatePicker.TableRow>
          </ArkDatePicker.TableHead>
          <ArkDatePicker.TableBody data-slot="calendar-body" className={r.body()}>
            {api.weeks.map((week, i) => (
              <ArkDatePicker.TableRow key={i} data-slot="calendar-row" className={r.row()}>
                {week.map((day) => (
                  <ArkDatePicker.TableCell key={day.toString()} value={day} data-slot="calendar-cell" className={r.cell()}>
                    <ArkDatePicker.TableCellTrigger data-slot="calendar-cell-trigger" className={r.cellTrigger()}>
                      {api.format(day, { day: "numeric" })}
                    </ArkDatePicker.TableCellTrigger>
                  </ArkDatePicker.TableCell>
                ))}
              </ArkDatePicker.TableRow>
            ))}
          </ArkDatePicker.TableBody>
        </ArkDatePicker.Table>
      </ArkDatePicker.View>
      <ArkDatePicker.View view="month" data-slot="calendar-view" className={r.view()}>
        {header("month")}
        <ArkDatePicker.Table columns={4} data-slot="calendar-grid" className={r.grid()}>
          <ArkDatePicker.TableBody data-slot="calendar-body" className={r.body()}>
            {api.getMonthsGrid({ columns: 4, format: "short" }).map((months, i) => (
              <ArkDatePicker.TableRow key={i} data-slot="calendar-row" className={r.row()}>
                {months.map((month) => (
                  <ArkDatePicker.TableCell key={month.value} value={month.value} data-slot="calendar-cell" className={r.cell()}>
                    <ArkDatePicker.TableCellTrigger data-slot="calendar-cell-trigger" className={r.cellTrigger()}>{month.label}</ArkDatePicker.TableCellTrigger>
                  </ArkDatePicker.TableCell>
                ))}
              </ArkDatePicker.TableRow>
            ))}
          </ArkDatePicker.TableBody>
        </ArkDatePicker.Table>
      </ArkDatePicker.View>
      <ArkDatePicker.View view="year" data-slot="calendar-view" className={r.view()}>
        {header("year")}
        <ArkDatePicker.Table columns={4} data-slot="calendar-grid" className={r.grid()}>
          <ArkDatePicker.TableBody data-slot="calendar-body" className={r.body()}>
            {api.getYearsGrid({ columns: 4 }).map((years, i) => (
              <ArkDatePicker.TableRow key={i} data-slot="calendar-row" className={r.row()}>
                {years.map((y) => (
                  <ArkDatePicker.TableCell key={y.value} value={y.value} data-slot="calendar-cell" className={r.cell()}>
                    <ArkDatePicker.TableCellTrigger data-slot="calendar-cell-trigger" className={r.cellTrigger()}>{year(y.value)}</ArkDatePicker.TableCellTrigger>
                  </ArkDatePicker.TableCell>
                ))}
              </ArkDatePicker.TableRow>
            ))}
          </ArkDatePicker.TableBody>
        </ArkDatePicker.Table>
      </ArkDatePicker.View>
    </>
  );
}

/** A month grid to pick a date, several dates or a range, shown inline. Behaviour by Ark UI (Zag date-picker). */
export function Calendar({ value, defaultValue, onValueChange, "aria-label": ariaLabel, className, style, ...rest }: CalendarProps) {
  const { selectionMode, min, max, unavailable, isDateUnavailable, defaultFocusedValue, startOfWeek, locale, timeZone, fixedWeeks, disabled, readOnly, ...data } = rest;
  useEffect(() => trackModality(), []);
  const { options, id } = useCalendarOptions({ selectionMode, min, max, unavailable, isDateUnavailable, defaultFocusedValue, startOfWeek, locale, timeZone, fixedWeeks, disabled, readOnly }, value, defaultValue, onValueChange);
  const r = calendar();
  return (
    <ArkDatePicker.Root {...data} {...options} inline data-slot="calendar" className={r.base({ class: className })} style={style}>
      {/* the engine finds the focused date inside its content element, so the inline calendar has one too */}
      <ArkDatePicker.Content data-slot="calendar-content" className={r.content()} aria-label={ariaLabel}>
        <CalendarViews id={id} />
      </ArkDatePicker.Content>
    </ArkDatePicker.Root>
  );
}
