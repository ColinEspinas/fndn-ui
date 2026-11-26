import { Combobox } from "@fndn/react";

/* type to filter; a viewer cannot review, so that option is disabled */
const people = [
  { value: "maya", label: "Maya Chen", meta: "Owner" },
  { value: "daniel", label: "Daniel Okafor", meta: "Admin" },
  { value: "priya", label: "Priya Raman", meta: "Member" },
  { value: "lucas", label: "Lucas Moreau", meta: "Member" },
  { value: "aiko", label: "Aiko Tanaka", meta: "Member" },
  { value: "sofia", label: "Sofia Alvarez", meta: "Viewer", disabled: true },
  { value: "jonas", label: "Jonas Weber", meta: "Member" },
];

export default function Reviewer() {
  return <Combobox items={people} label="Reviewer" placeholder="Search people" emptyText="No one in Northwind matches" style={{ width: 240 }} />;
}
