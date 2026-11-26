import { Listbox } from "@fndn/react";

/* every option stays in view; meta on the right, a disabled option says why */
const regions = [
  { value: "iad1", label: "Washington, D.C. (iad1)", meta: "18 ms" },
  { value: "fra1", label: "Frankfurt (fra1)", meta: "96 ms" },
  { value: "gru1", label: "São Paulo (gru1)", meta: "Business plan", disabled: true },
];

export default function Region() {
  return <Listbox items={regions} label="Region" defaultValue={["iad1"]} style={{ width: 280 }} />;
}
