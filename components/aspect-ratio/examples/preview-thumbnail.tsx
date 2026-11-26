import { Browsers } from "@phosphor-icons/react";
import { AspectRatio, StatusPill } from "@fndn/react";

export default function PreviewThumbnail() {
  return (
    <div className="flex w-80 max-w-full items-center gap-3">
      <div className="w-36 shrink-0">
        <AspectRatio ratio={16 / 9} className="rounded-control bg-inset">
          <div className="grid place-items-center text-ink-3">
            <Browsers data-slot="icon" weight="bold" className="text-2xl" aria-hidden />
          </div>
        </AspectRatio>
      </div>
      <div className="flex min-w-0 flex-col items-start gap-1 text-sm">
        <p className="font-medium text-ink">web-app</p>
        <p className="max-w-full truncate text-ink-2" title="feat/usage-alerts">feat/usage-alerts</p>
        <StatusPill tone="green" size="sm">Ready</StatusPill>
      </div>
    </div>
  );
}
