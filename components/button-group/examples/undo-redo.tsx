import { ArrowClockwise, ArrowCounterClockwise } from "@phosphor-icons/react";
import { Button, ButtonGroup, Tooltip } from "@fndn/react";

/* icon-only and joined: each button named by aria-label and its tooltip */
export default function UndoRedo() {
  return (
    <ButtonGroup label="History">
      <Tooltip content="Undo">
        <Button size="sm" shape="rounded" square aria-label="Undo" icon={<ArrowCounterClockwise data-slot="icon" weight="bold" />} />
      </Tooltip>
      <Tooltip content="Redo">
        <Button size="sm" shape="rounded" square aria-label="Redo" disabled icon={<ArrowClockwise data-slot="icon" weight="bold" />} />
      </Tooltip>
    </ButtonGroup>
  );
}
