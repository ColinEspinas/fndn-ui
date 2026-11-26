import { EntityChip } from "@fndn/react";

/* a custom monogram when the first letter says nothing: a channel */
export default function AlertChannel() {
  return (
    <p className="max-w-[300px] text-md text-ink">
      Failed deploys post to <EntityChip name="deploys" monogram="#" color="var(--fndn-tag-green)" /> and page <EntityChip name="Jonas Weber" color="var(--fndn-tag-blue)" /> after 10 minutes.
    </p>
  );
}
