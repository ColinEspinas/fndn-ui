import { DatePicker } from "@fndn/react";

/* nights already booked cannot be chosen */
const booked = ["2026-12-21", "2026-12-22", "2026-12-23"];

export default function Booking() {
  return (
    <DatePicker
      label="Stay"
      selectionMode="range"
      defaultValue={["2026-12-10", "2026-12-14"]}
      min="2026-12-03"
      unavailable={booked}
      style={{ width: 260 }}
    />
  );
}
