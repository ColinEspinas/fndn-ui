import { Calendar } from "@fndn/react";

export default function Locale() {
  return <Calendar aria-label="Liefertermin" locale="de-DE" startOfWeek={1} defaultValue={["2026-12-12"]} />;
}
