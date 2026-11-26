import { useState } from "react";
import { Calendar } from "@fndn/react";

export default function DeliveryDate() {
  const [dates, setDates] = useState<string[]>(["2026-12-12"]);
  return (
    <div className="flex flex-col gap-2">
      <Calendar aria-label="Delivery date" value={dates} onValueChange={setDates} />
      <span className="text-sm text-ink-2">{dates[0] ? `Delivery on ${dates[0]}.` : "No date chosen."}</span>
    </div>
  );
}
