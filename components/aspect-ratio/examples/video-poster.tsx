import { Play } from "@phosphor-icons/react";
import { AspectRatio, Button } from "@fndn/react";

export default function VideoPoster() {
  return (
    <figure className="flex w-80 max-w-full flex-col gap-2">
      <AspectRatio ratio={16 / 9} className="rounded-card bg-[linear-gradient(135deg,var(--fndn-accent),var(--fndn-ink))]">
        <div className="grid place-items-center">
          <Button variant="outline" square aria-label="Play: Preview environments in two minutes" icon={<Play data-slot="icon" weight="fill" />} />
        </div>
      </AspectRatio>
      <figcaption className="text-sm text-ink-2">Preview environments in two minutes · 2:14</figcaption>
    </figure>
  );
}
