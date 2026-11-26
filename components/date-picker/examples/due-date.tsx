import { DatePicker } from "@fndn/react";

export default function DueDate() {
  return <DatePicker label="Due date" name="dueDate" defaultValue={["2026-12-12"]} style={{ width: 220 }} />;
}
