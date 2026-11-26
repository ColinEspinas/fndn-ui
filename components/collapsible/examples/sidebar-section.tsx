import { Collapsible } from "@fndn/react";

const projects = ["web-app", "billing-api", "mobile", "data-pipeline"];

/* section: a quiet header with the caret first, over a group of links */
export default function SidebarSection() {
  return (
    <Collapsible variant="section" caret="start" defaultOpen label="Projects" style={{ width: 240 }}>
      <ul className="flex flex-col px-2.5 pb-1 text-sm">
        {projects.map((project) => (
          <li key={project}>
            <a href={`#${project}`} className="block rounded-chip py-1 text-ink-2 hover:text-ink">{project}</a>
          </li>
        ))}
      </ul>
    </Collapsible>
  );
}
