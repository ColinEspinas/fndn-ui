import { useState } from "react";
import { NumberInput } from "@fndn/react";

const price = 20;

/* controlled: the total follows the value as it changes */
export default function SeatsTotal() {
  const [seats, setSeats] = useState("8");
  const count = Number(seats) || 0;
  return (
    <div className="flex items-end gap-3">
      <NumberInput label="Seats on Team" value={seats} onValueChange={setSeats} min={1} max={500} className="w-36" />
      <span className="pb-1.5 text-sm text-ink-2">${(count * price).toLocaleString("en-US")} a month</span>
    </div>
  );
}
