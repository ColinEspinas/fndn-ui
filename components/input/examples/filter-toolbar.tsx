import { Button, Input } from "@fndn/react";
import { DownloadSimple } from "@phosphor-icons/react";

/* sm: 28px, the same height as the sm Button beside it */
export default function FilterToolbar() {
  return (
    <div className="flex w-full max-w-[360px] items-center gap-2">
      <Input size="sm" type="search" placeholder="Filter by branch or commit" aria-label="Filter deploys" className="min-w-0 flex-1" />
      <Button size="sm" icon={<DownloadSimple data-slot="icon" weight="bold" />}>Export</Button>
    </div>
  );
}
