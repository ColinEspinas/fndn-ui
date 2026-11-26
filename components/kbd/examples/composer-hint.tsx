import { Kbd } from "@fndn/react";

/* plain: no box, for a quiet hint line under a field */
export default function ComposerHint() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-ink-2">
      <Kbd variant="plain" keys={["↵"]} /> to comment
      <span aria-hidden="true">·</span>
      <Kbd variant="plain" keys={["⇧", "↵"]} /> for a new line
    </p>
  );
}
