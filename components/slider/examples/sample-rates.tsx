import { Slider } from "@fndn/react";

/* sm: a smaller track and thumb for a dense settings panel */
const percent = (v: number) => `${v}%`;

export default function SampleRates() {
  return (
    <div className="flex w-72 flex-col gap-4">
      <Slider size="sm" label="Log sampling" showValue defaultValue={[25]} formatValue={percent} />
      <Slider size="sm" label="Trace sampling" showValue defaultValue={[10]} formatValue={percent} />
    </div>
  );
}
