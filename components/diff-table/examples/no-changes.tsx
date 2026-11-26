import type { ComponentProps } from "react";
import { DiffTable } from "@fndn/react";

type Props = ComponentProps<typeof DiffTable>;

const columns: Props["columns"] = ["Plan", "Billing", "Price"];

const labels: Props["labels"] = { empty: "Prices already match the plan sheet" };

export default function NoPriceChanges() {
  return <DiffTable title="Proposed price changes" columns={columns} rows={[]} labels={labels} />;
}
