import { Separator } from "@fndn/react";

export default function SettingsSections() {
  return (
    <div className="flex w-72 flex-col gap-3 text-sm">
      <div>
        <p className="font-medium text-ink">Project name</p>
        <p className="text-ink-2">web-app, used in preview URLs and the CLI.</p>
      </div>
      <Separator />
      <div>
        <p className="font-medium text-ink">Production branch</p>
        <p className="text-ink-2">Pushes to main deploy to Production.</p>
      </div>
    </div>
  );
}
