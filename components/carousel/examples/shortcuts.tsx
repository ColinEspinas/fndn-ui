import { Carousel } from "@fndn/react";

/* a dense tool, where nothing should move: the tip changes at once */
const shortcuts = [
  "⌘P opens any file by name.",
  "⌘⇧F searches every file in the workspace.",
  "⌥↑ and ⌥↓ move the current line.",
  "⌘/ comments out the selection.",
];

export default function Shortcuts() {
  return <Carousel className="w-full max-w-sm" label="Shortcuts" effect="none" indicators loop="rewind" items={shortcuts} />;
}
