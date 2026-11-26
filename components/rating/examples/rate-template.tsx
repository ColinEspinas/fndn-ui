import { useState } from "react";
import { Rating } from "@fndn/react";

/* half stars: the first half of a star picks .5 */
export default function RateTemplate() {
  const [score, setScore] = useState(3.5);
  return (
    <div className="flex flex-col gap-2">
      <Rating label="Rate the Status page template" allowHalf value={score} onValueChange={setScore} />
      <p className="text-xs text-ink-2 tabular-nums">{score.toFixed(1)} of 5</p>
    </div>
  );
}
