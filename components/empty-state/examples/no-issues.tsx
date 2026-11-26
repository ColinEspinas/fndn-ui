import { Plus } from "@phosphor-icons/react";
import { Button, EmptyState } from "@fndn/react";

/* the next step under the text: the one thing to do in an empty project */
export default function NoIssues() {
  return (
    <EmptyState
      size="block"
      icon="folder-open"
      title="No open issues in billing-api"
      hint="Issues you create or import show up here."
      action={<Button variant="outline" size="sm" shape="rounded" icon={<Plus data-slot="icon" weight="bold" />}>New issue</Button>}
    />
  );
}
