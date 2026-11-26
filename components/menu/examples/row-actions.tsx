import { Copy, DotsThree, Folder, PencilSimple, Trash } from "@phosphor-icons/react";
import { Button, Menu, Tooltip, type MenuEntry } from "@fndn/react";

const projects = [
  { name: "web-app", meta: "Deployed 2 min ago by Maya Chen" },
  { name: "billing-api", meta: "Deployed yesterday by Daniel Okafor" },
  { name: "data-pipeline", meta: "No deploys yet" },
];

const actions: MenuEntry[] = [
  { value: "rename", label: "Rename", icon: <PencilSimple data-slot="icon" weight="bold" /> },
  { value: "duplicate", label: "Duplicate", icon: <Copy data-slot="icon" weight="bold" /> },
  { value: "move", label: "Move to…", icon: <Folder data-slot="icon" weight="bold" /> },
  { type: "separator" },
  { value: "delete", label: "Delete", tone: "danger", icon: <Trash data-slot="icon" weight="bold" /> },
];

export default function RowActions() {
  return (
    <ul className="flex w-80 flex-col gap-1">
      {projects.map((project) => (
        <li key={project.name} className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium text-ink">{project.name}</span>
            <span className="text-xs text-ink-2">{project.meta}</span>
          </div>
          <Menu placement="bottom-end" items={actions}>
            <Tooltip content="More actions">
              <Button variant="ghost" size="sm" square aria-label={`More actions for ${project.name}`} icon={<DotsThree data-slot="icon" weight="bold" />} />
            </Tooltip>
          </Menu>
        </li>
      ))}
    </ul>
  );
}
