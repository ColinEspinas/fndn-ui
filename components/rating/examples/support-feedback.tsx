import { useState } from "react";
import { Rating } from "@fndn/react";

/* asking for a score: the label is the question, a word under the stars says what the score means */
const WORDS = ["", "Did not help", "Slow to help", "Solved it eventually", "Quick and clear", "Excellent"];

export default function SupportFeedback() {
  const [score, setScore] = useState(4);
  return (
    <div className="flex flex-col gap-2">
      <Rating label="How was your chat with Aiko Tanaka?" value={score} onValueChange={setScore} />
      <p className="h-4 text-xs text-ink-2" aria-live="polite">{WORDS[score]}</p>
    </div>
  );
}
