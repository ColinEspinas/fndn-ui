import { Editable, TextRow } from "@fndn/react";

/* inline: the value of a detail row, edited in place */
export default function ProjectDetails() {
  return (
    <div style={{ width: 320 }}>
      <TextRow label="Production branch" value={<Editable variant="inline" aria-label="Production branch" defaultValue="main" />} />
      <TextRow label="Build command" value={<Editable variant="inline" aria-label="Build command" defaultValue="pnpm build" />} />
      <TextRow label="Build timeout" value={<Editable variant="inline" aria-label="Build timeout in minutes" defaultValue="15" />} meta="min" />
    </div>
  );
}
