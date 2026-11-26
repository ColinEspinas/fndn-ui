import { Calendar } from "@fndn/react";

export default function Range() {
  return <Calendar aria-label="Stay" selectionMode="range" defaultValue={["2026-12-10", "2026-12-14"]} />;
}
