import { DotsThree, LinkSimple, PencilSimple } from "@phosphor-icons/react";
import { Button, Tooltip } from "@fndn/react";

/* icon-only buttons: ghost and muted, square, each named by aria-label and its tooltip */
const actions = [
  { label: "Edit title", Icon: PencilSimple },
  { label: "Copy link", Icon: LinkSimple },
  { label: "More actions", Icon: DotsThree },
];

export default function RowActions() {
  return (
    <div className="flex w-80 items-center justify-between gap-3">
      <p className="min-w-0 text-sm text-ink">#482 Add retry to webhook delivery</p>
      <div role="toolbar" aria-label="Pull request actions" className="flex shrink-0 gap-0.5">
        {actions.map(({ label, Icon }) => (
          <Tooltip key={label} content={label}>
            <Button variant="ghost" size="sm" square muted aria-label={label} icon={<Icon data-slot="icon" weight="bold" />} />
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
