import { useState } from "react";
import { Listbox } from "@fndn/react";

const projects = ["web-app", "billing-api", "mobile", "docs-site", "data-pipeline"];

export default function ExportProjects() {
  const [picked, setPicked] = useState<string[]>(["web-app", "billing-api"]);
  return (
    <div className="flex flex-col gap-2" style={{ width: 240 }}>
      <Listbox items={projects} label="Projects to export" selectionMode="multiple" value={picked} onValueChange={setPicked} />
      <span className="text-sm text-ink-2">{picked.length ? `${picked.length} of ${projects.length} projects` : "Pick at least one project."}</span>
    </div>
  );
}
