import { Editable } from "@fndn/react";

/* reads as text until focused or clicked; Enter saves, Escape puts the old name back */
export default function ProjectName() {
  return <Editable label="Project name" defaultValue="billing-api" style={{ width: 260 }} />;
}
