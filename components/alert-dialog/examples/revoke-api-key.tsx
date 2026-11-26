import { Trash } from "@phosphor-icons/react";
import { AlertDialog, Button, Tooltip } from "@fndn/react";

const key = { name: "Production server", hint: "nw_live_…4f2a", lastUsed: "Used 3 min ago" };

/* your own trigger: the row's icon button, named by its tooltip */
export default function RevokeApiKey() {
  return (
    <div className="flex w-80 items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">{key.name}</div>
        <div className="text-xs text-ink-2"><span className="font-mono">{key.hint}</span> · {key.lastUsed}</div>
      </div>
      <AlertDialog
        trigger={
          <Tooltip content="Revoke key">
            <Button variant="ghost" size="sm" square muted aria-label={`Revoke ${key.name} key`} icon={<Trash data-slot="icon" weight="bold" />} />
          </Tooltip>
        }
        title={`Revoke the ${key.name} key?`}
        description={`Apps that use ${key.hint} stop working at once. Create a new key before you revoke this one.`}
        actionLabel="Revoke key"
      />
    </div>
  );
}
