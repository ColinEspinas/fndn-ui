import { Slider } from "@fndn/react";

/* a range: two thumbs, each named, kept a few steps apart */
export default function ResponseTime() {
  return (
    <Slider
      label="Response time"
      showValue
      min={0}
      max={2000}
      step={10}
      defaultValue={[120, 800]}
      minStepsBetweenThumbs={5}
      thumbLabels={["Fastest", "Slowest"]}
      formatValue={(v) => `${v} ms`}
      className="w-80"
    />
  );
}
