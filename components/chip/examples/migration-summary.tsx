import { Chip } from "@fndn/react";

/* green added, orange changed, red removed */
export default function MigrationSummary() {
  return (
    <p className="max-w-[300px] text-md text-ink">
      This migration adds <Chip tone="green">retry_count</Chip>, renames <Chip tone="orange">sent_at</Chip> to <Chip tone="orange">delivered_at</Chip> and drops <Chip tone="red">legacy_status</Chip> from <Chip>webhooks</Chip>.
    </p>
  );
}
