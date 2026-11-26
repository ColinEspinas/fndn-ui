import { Avatar } from "@fndn/react";

const projects = [
  { name: "web-app", initials: "W", color: "var(--fndn-tag-orange)", env: "Production" },
  { name: "billing-api", initials: "B", color: "var(--fndn-tag-purple)", env: "Production" },
  { name: "docs-site", initials: "D", color: "var(--fndn-tag-cyan)", env: "Preview" },
];

/* square for things (projects, workspaces), round for people */
export default function ProjectList() {
  return (
    <ul className="flex w-64 flex-col gap-2.5 text-sm">
      {projects.map((project) => (
        <li key={project.name} className="flex items-center gap-2.5">
          <Avatar name={project.name} initials={project.initials} color={project.color} shape="square" size="20" />
          <span className="flex-1 font-medium text-ink">{project.name}</span>
          <span className="text-ink-2">{project.env}</span>
        </li>
      ))}
    </ul>
  );
}
