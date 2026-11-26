import { ProgressRing } from "@fndn/react";

const steps = [
  { name: "Build", note: "48s", progress: 1, tone: "green" },
  { name: "Test", note: "38 of 64 suites", progress: 38 / 64, tone: "orange" },
  { name: "Deploy to Production", note: "Waiting", progress: 0, tone: "orange" },
] as const;

/* sm rings keep a list of steps compact */
export default function PipelineSteps() {
  return (
    <ol className="flex w-72 flex-col gap-2 text-sm">
      {steps.map((step, i) => (
        <li key={step.name} className="flex items-center gap-3">
          <ProgressRing progress={step.progress} tone={step.tone} size="sm" label={`${step.name}: ${step.note}`}>{i + 1}</ProgressRing>
          <span className="flex-1 text-ink">{step.name}</span>
          <span className="text-ink-2 tabular-nums">{step.note}</span>
        </li>
      ))}
    </ol>
  );
}
