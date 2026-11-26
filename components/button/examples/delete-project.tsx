import { Trash } from "@phosphor-icons/react";
import { Button } from "@fndn/react";

/* a danger zone: the outline danger look (red edge, red fill on hover); the filled danger is for the confirmation that follows. The label names what goes */
export default function DeleteProject() {
  return (
    <div className="flex max-w-96 flex-col items-start gap-3">
      <div>
        <p className="text-sm font-medium text-ink">Delete billing-api</p>
        <p className="text-sm text-ink-2">Removes 128 deploys, 3 environments and every API key of this project.</p>
      </div>
      <Button variant="danger-outline" icon={<Trash data-slot="icon" weight="bold" />}>Delete project</Button>
    </div>
  );
}
