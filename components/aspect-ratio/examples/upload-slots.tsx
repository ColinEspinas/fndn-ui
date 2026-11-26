import { Image } from "@phosphor-icons/react";
import { AspectRatio } from "@fndn/react";

const slots = [
  { ratio: 1, name: "Workspace logo", size: "512 × 512" },
  { ratio: 1.91, name: "Social card", size: "1200 × 630" },
  { ratio: 9 / 16, name: "Phone screenshot", size: "1080 × 1920" },
];

export default function UploadSlots() {
  return (
    <div className="grid w-[400px] max-w-full grid-cols-3 items-end gap-3">
      {slots.map((slot) => (
        <div key={slot.name} className="flex min-w-0 flex-col gap-1.5">
          <AspectRatio ratio={slot.ratio} className="rounded-control bg-inset">
            <div className="grid place-items-center text-ink-3">
              <Image data-slot="icon" weight="bold" className="text-xl" aria-hidden />
            </div>
          </AspectRatio>
          <p className="text-sm text-ink">{slot.name}</p>
          <p className="text-xs text-ink-2 tabular-nums">{slot.size}</p>
        </div>
      ))}
    </div>
  );
}
