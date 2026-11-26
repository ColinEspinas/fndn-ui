<!-- A month grid to pick a date, several dates or a range, shown inline. Behaviour by Ark UI (Zag date-picker). -->
<script lang="ts">
  import { DatePicker as ArkDatePicker } from "@ark-ui/svelte/date-picker";
  import CalendarViews, { calendarOptions, type CalendarOptions } from "./CalendarViews.svelte";
  import { calendar } from "./calendar.recipe";
  import { trackModality } from "../lib/modality";

  type Props = CalendarOptions & {
    /** Two-way bindable: <Calendar bind:value />, the selected dates (ISO). Omit for uncontrolled (defaultValue). */
    value?: string[];
    defaultValue?: string[];
    onvaluechange?: (value: string[]) => void;
    /** Names the calendar for assistive technology. */
    "aria-label"?: string;
    class?: string;
    style?: string;
    /** Forwarded to the root (a host marks it data-<block>="<part>"). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    value = $bindable(), defaultValue, onvaluechange, "aria-label": ariaLabel, class: className, style,
    selectionMode, min, max, unavailable, isDateUnavailable, defaultFocusedValue, startOfWeek, locale, timeZone, fixedWeeks, disabled, readOnly, ...data
  }: Props = $props();

  const id = $props.id();
  const options = $derived(
    calendarOptions({ selectionMode, min, max, unavailable, isDateUnavailable, defaultFocusedValue, startOfWeek, locale, timeZone, fixedWeeks, disabled, readOnly }, id, value, defaultValue, (next) => {
      value = next;
      onvaluechange?.(next);
    }),
  );
  const r = calendar();
  $effect(() => trackModality());
</script>

<ArkDatePicker.Root {...data} {...options} inline data-slot="calendar" class={r.base({ class: className })} {style}>
  <!-- the engine finds the focused date inside its content element, so the inline calendar has one too -->
  <ArkDatePicker.Content data-slot="calendar-content" class={r.content()} aria-label={ariaLabel}>
    <CalendarViews {id} />
  </ArkDatePicker.Content>
</ArkDatePicker.Root>
