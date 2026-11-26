import { useState } from "react";
import { DotsThree, Tag, UserPlus, X } from "@phosphor-icons/react";
import { Button, Menu, Tooltip, type MenuEntry } from "@fndn/react";

const people: Record<string, string> = {
  priya: "Priya Raman",
  lucas: "Lucas Moreau",
  aiko: "Aiko Tanaka",
  sofia: "Sofia Alvarez",
};

/* a sub-menu keeps a second-level choice out of the first list */
const items: MenuEntry[] = [
  {
    type: "submenu",
    label: "Request review",
    icon: <UserPlus data-slot="icon" weight="bold" />,
    items: Object.entries(people).map(([value, label]) => ({ value, label })),
  },
  {
    type: "submenu",
    label: "Add label",
    icon: <Tag data-slot="icon" weight="bold" />,
    items: [
      { value: "bug", label: "bug" },
      { value: "reliability", label: "reliability" },
      { value: "needs-docs", label: "needs-docs" },
    ],
  },
  { type: "separator" },
  { value: "close", label: "Close pull request", tone: "danger", icon: <X data-slot="icon" weight="bold" /> },
];

export default function PullRequestActions() {
  const [reviewer, setReviewer] = useState("");
  return (
    <div className="flex w-80 items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-ink">#482 Add retry to webhook delivery</span>
        <span className="text-xs text-ink-2">{reviewer ? `Review requested from ${reviewer}` : "Daniel Okafor wants to merge into main"}</span>
      </div>
      <Menu placement="bottom-end" items={items} onSelect={(value) => people[value] && setReviewer(people[value])}>
        <Tooltip content="More actions">
          <Button variant="ghost" size="sm" square aria-label="More actions for #482" icon={<DotsThree data-slot="icon" weight="bold" />} />
        </Tooltip>
      </Menu>
    </div>
  );
}
