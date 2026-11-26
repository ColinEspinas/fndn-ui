<script lang="ts">
  import { Calendar } from "@fndn/svelte";

  /* weekends and two holidays cannot be booked; nothing before the 3rd or after the 28th */
  const weekend = (date: string) => [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay());
</script>

<Calendar
  aria-label="Appointment"
  defaultFocusedValue="2026-12-01"
  min="2026-12-01"
  max="2026-12-23"
  unavailable={["2026-12-09", "2026-12-16"]}
  isDateUnavailable={weekend}
/>
