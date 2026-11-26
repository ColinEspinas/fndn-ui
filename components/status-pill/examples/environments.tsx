import { StatusPill } from "@fndn/react";

/* a neutral pill whose dot alone carries the colour: a category, not a state */
const environments = [
  { name: "Production", dot: "green" },
  { name: "Staging", dot: "yellow" },
  { name: "Preview", dot: "purple" },
] as const;

export default function Environments() {
  return (
    <div className="flex flex-wrap gap-2">
      {environments.map((env) => (
        <StatusPill key={env.name} tone="neutral" dotTone={env.dot}>{env.name}</StatusPill>
      ))}
    </div>
  );
}
