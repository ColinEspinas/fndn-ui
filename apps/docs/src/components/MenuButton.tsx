/* The tree's menu button on narrow screens (the tree is behind it under 768px). */
import { List, X } from "@phosphor-icons/react";
import { Button } from "@fndn/components/button/button.tsx";
import { Tooltip } from "@fndn/components/tooltip/tooltip.tsx";
import { setOptions, useOptions } from "../lib/store";

export default function MenuButton() {
  const o = useOptions();
  return (
    <Tooltip content={o.treeOpen ? "Hide the tree" : "Show the tree"}>
      <Button
        variant="ghost" size="sm" square shape="rounded" muted
        aria-label="Components" aria-expanded={o.treeOpen} aria-controls="docs-tree"
        icon={o.treeOpen ? <X data-slot="icon" weight="bold" /> : <List data-slot="icon" weight="bold" />}
        onClick={() => setOptions({ treeOpen: !o.treeOpen })}
      />
    </Tooltip>
  );
}
