import { Chip } from "@fndn/react";

export default function ActiveQuery() {
  return (
    <p className="max-w-[300px] text-sm text-ink-2">
      Showing 14 deploys where <Chip tone="accent">state = error</Chip> and <Chip tone="accent">branch = main</Chip>, newest first.
    </p>
  );
}
