import { Slider } from "@fndn/react";

/* one number on a track: the label names it, the value shows formatted at the end of the row */
const usd = (v: number) => `$${v.toLocaleString("en-US")}`;

export default function SpendLimit() {
  return (
    <div className="flex w-80 flex-col gap-2">
      <Slider label="Monthly spend limit" showValue min={100} max={5000} step={100} defaultValue={[1200]} formatValue={usd} />
      <p className="text-xs text-ink-2">We email maya@northwind.example when Northwind reaches 80%.</p>
    </div>
  );
}
