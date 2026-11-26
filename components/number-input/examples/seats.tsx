import { NumberInput } from "@fndn/react";

/* min and max bound the steppers, the arrow keys and what can be typed */
export default function Seats() {
  return <NumberInput label="Seats" defaultValue="12" min={1} max={500} className="w-40" />;
}
