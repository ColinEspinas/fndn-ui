import { Shimmer } from "@fndn/react";

export default function Thinking() {
  return (
    <p role="status" className="text-sm">
      <Shimmer speed="fast">Thinking</Shimmer>
    </p>
  );
}
