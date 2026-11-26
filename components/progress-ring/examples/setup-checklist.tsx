import { Check, Circle } from "@phosphor-icons/react";
import { ProgressRing } from "@fndn/react";

const steps = [
  { name: "Deploy to Production", done: true },
  { name: "Add a custom domain", done: false },
  { name: "Turn on usage alerts", done: false },
];

export default function SetupChecklist() {
  return (
    <div className="flex w-72 flex-col gap-3 text-sm">
      <div className="flex items-center gap-3">
        <ProgressRing progress={3 / 5} label="Setup: 3 of 5 steps done">3</ProgressRing>
        <div>
          <p className="font-medium text-ink">Set up web-app</p>
          <p className="text-ink-2">3 of 5 steps done</p>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5">
        {steps.map((step) => (
          <li key={step.name} className={`flex items-center gap-2 ${step.done ? "text-ink-2 line-through" : "text-ink"}`}>
            {step.done ? <Check data-slot="icon" weight="bold" className="text-green" /> : <Circle data-slot="icon" className="text-ink-3" />}
            {step.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
