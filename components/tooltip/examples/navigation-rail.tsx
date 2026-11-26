import { ChartLine, Gear, House, RocketLaunch } from "@phosphor-icons/react";
import { Button, Tooltip } from "@fndn/react";

const pages = [
  { label: "Overview", icon: House },
  { label: "Deploys", icon: RocketLaunch },
  { label: "Usage", icon: ChartLine },
  { label: "Settings", icon: Gear },
];

/* a collapsed rail has no visible labels: the tooltip names each page, to the side */
export default function NavigationRail() {
  return (
    <nav aria-label="Project" className="flex flex-col gap-0.5">
      {pages.map(({ label, icon: Icon }) => (
        <Tooltip key={label} content={label} placement="right">
          <Button variant="ghost" square aria-label={label} icon={<Icon data-slot="icon" weight="bold" />} />
        </Tooltip>
      ))}
    </nav>
  );
}
