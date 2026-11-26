import { TextAlignCenter, TextAlignLeft, TextAlignRight } from "@phosphor-icons/react";
import { ToggleGroup } from "@fndn/react";

/* one at most, never none: alignment always has a value; icon-only items are named by their labels */
const alignments = [
  { value: "left", label: "Align left", icon: <TextAlignLeft data-slot="icon" weight="bold" /> },
  { value: "center", label: "Align center", icon: <TextAlignCenter data-slot="icon" weight="bold" /> },
  { value: "right", label: "Align right", icon: <TextAlignRight data-slot="icon" weight="bold" /> },
];

export default function Alignment() {
  return (
    <ToggleGroup
      aria-label="Alignment"
      variant="ghost"
      size="sm"
      shape="rounded"
      square
      muted
      deselectable={false}
      defaultValue={["left"]}
      items={alignments}
    />
  );
}
