import { Carousel } from "@fndn/react";

const projects = [
  { name: "web-app", detail: "Deployed 2 min ago" },
  { name: "billing-api", detail: "Deployed 1 h ago" },
  { name: "mobile", detail: "Building" },
  { name: "docs-site", detail: "Deployed yesterday" },
  { name: "data-pipeline", detail: "Failed on Staging" },
];

export default function Projects() {
  return (
    <Carousel
      className="w-full max-w-lg"
      label="Projects"
      slidesPerPage={3}
      spacing={8}
      indicators
      items={projects.map((project) => ({
        label: project.name,
        content: (
          <div className="flex h-20 flex-col justify-end gap-0.5 bg-inset p-3 text-sm">
            <p className="truncate font-medium text-ink">{project.name}</p>
            <p className="truncate text-xs text-ink-2">{project.detail}</p>
          </div>
        ),
      }))}
    />
  );
}
