import { WarningCircle } from "@phosphor-icons/react";
import { Button, Shimmer } from "@fndn/react";

export default function SuggestAFix() {
  return (
    <div className="flex w-80 max-w-full items-center gap-2 text-sm">
      <WarningCircle data-slot="icon" weight="fill" className="shrink-0 text-red" aria-hidden />
      <span className="min-w-0 flex-1 text-ink-2">Build failed on main · a1b2c3d</span>
      <Button size="sm" variant="ghost">
        <Shimmer speed="fast" tone="accent">Suggest a fix</Shimmer>
      </Button>
    </div>
  );
}
