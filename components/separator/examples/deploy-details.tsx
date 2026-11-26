import { Separator } from "@fndn/react";

/* vertical: as tall as the row it sits in; decorative, the values read fine without it */
export default function DeployDetails() {
  return (
    <div className="flex h-5 items-center gap-3 text-sm text-ink-2">
      <span>dpl_7f3a9c</span>
      <Separator orientation="vertical" decorative />
      <span>main</span>
      <Separator orientation="vertical" decorative />
      <span>a1b2c3d</span>
      <Separator orientation="vertical" decorative />
      <span>2 min ago</span>
    </div>
  );
}
