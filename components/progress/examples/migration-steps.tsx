import { Progress } from "@fndn/react";

export default function MigrationSteps() {
  return <Progress className="w-full max-w-sm" value={3} max={8} label="Migrating the billing-api database" showValue valueText="3 of 8 tables" size="sm" />;
}
