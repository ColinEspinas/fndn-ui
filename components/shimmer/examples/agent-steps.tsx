import { Check, Sparkle } from "@phosphor-icons/react";
import { Shimmer } from "@fndn/react";

const done = ["Read the failing test in webhooks.test.ts", "Found the 10 s timeout in deliver()"];

export default function AgentSteps() {
  return (
    <ol className="flex w-80 max-w-full flex-col gap-2 text-sm">
      {done.map((step) => (
        <li key={step} className="flex items-center gap-2 text-ink-2">
          <Check data-slot="icon" weight="bold" className="shrink-0 text-green" aria-hidden />
          {step}
        </li>
      ))}
      <li className="flex items-center gap-2">
        <Sparkle data-slot="icon" weight="fill" className="shrink-0 text-accent" aria-hidden />
        <Shimmer>Writing a retry with backoff…</Shimmer>
      </li>
    </ol>
  );
}
