import { DatePicker } from "@fndn/react";

const weekend = (date: string) => [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay());

/* the calendar is the point here, so it starts open: weekends, booked days and the dates outside
 * Dec 1–23 cannot be chosen */
export default function Appointment() {
  return (
    <div style={{ width: 300, height: 340 }}>
      <DatePicker
        label="Appointment"
        placeholder="Pick a weekday"
        defaultOpen
        defaultFocusedValue="2026-12-01"
        min="2026-12-01"
        max="2026-12-23"
        unavailable={["2026-12-09", "2026-12-16"]}
        isDateUnavailable={weekend}
        style={{ width: 220 }}
      />
    </div>
  );
}
