import { useState } from "react";
import { Slider } from "@fndn/react";

/* controlled: the price under the slider follows it while it moves */
const PRICE = 18;

export default function Replicas() {
  const [replicas, setReplicas] = useState([3]);
  const count = replicas[0] ?? 1;
  return (
    <div className="flex w-80 flex-col gap-2">
      <Slider label="Replicas of billing-api" showValue min={1} max={10} value={replicas} onValueChange={setReplicas} />
      <p className="text-sm text-ink-2 tabular-nums">
        {count} × ${PRICE} = <span className="text-ink">${count * PRICE}.00</span> per month
      </p>
    </div>
  );
}
