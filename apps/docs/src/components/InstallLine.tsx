/* The install command of one component (the same in every framework: the tool reads it from fndn.json), in the system's code block. */
import { CodeBlock } from "@fndn/components/code-block/code-block.tsx";
import { installCommand } from "../lib/types";
import { gated } from "../lib/gate";
import { useSwapProps } from "../lib/persist";

export default gated(InstallLine, () => <div className="h-11 rounded-card border border-line bg-surface" aria-hidden />);

function InstallLine(props: { name: string }) {
  /* persisted across pages: the next page's name in the frame of the swap (lib/persist.ts) */
  const { name } = useSwapProps("docs-install", props);
  const cmd = installCommand(name);
  /* a command never wraps: a token broken in two reads as two; it scrolls sideways */
  return <CodeBlock variant="command" wrap={false} value={cmd} aria-label="Install command" />;
}
