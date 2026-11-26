import { ArrowClockwise, ArrowSquareOut, DownloadSimple } from "@phosphor-icons/react";
import { Button, ButtonGroup } from "@fndn/react";

/* vertical: a stack of related actions in a narrow side panel */
export default function DeployActions() {
  return (
    <ButtonGroup label="Deploy dpl_7f3a9c" orientation="vertical" className="w-52">
      <Button size="sm" icon={<ArrowSquareOut data-slot="icon" weight="bold" />}>Open preview</Button>
      <Button size="sm" icon={<DownloadSimple data-slot="icon" weight="bold" />}>Download build log</Button>
      <Button size="sm" icon={<ArrowClockwise data-slot="icon" weight="bold" />}>Redeploy</Button>
    </ButtonGroup>
  );
}
