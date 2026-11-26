/* tree-view — shared by the React, Vue and Svelte adapters.
 * Plain TypeScript, no framework imports. */
import { glide } from "../lib/glide";

/** The rows the highlight travels between. */
export const TREE_ROWS = "[data-slot=tree-view-item],[data-slot=tree-view-branch-control]";

/** The gliding hover highlight of a tree (lib/glide.ts), which also follows the row's level.
 *
 * A row's fill starts where its level starts, so no guide is ever under a fill. glide() moves the
 * layer down the list; this tells the layer the level of the row it is going to (the engine's
 * data-depth, as --tree-hl-depth), and the recipe turns that into the layer's inline offset and
 * width, which ease with the same timing as the vertical move.
 *
 * It listens to the same events as glide() does in hover mode (pointerover, and focusin in the
 * capture phase) and is registered first, so the level is set before glide() places the layer:
 * on a first appearance glide() lands the layer with its transition off, and the level lands
 * with it instead of sliding in from the last row's. */
export function glideTree(tree: HTMLElement, layer: HTMLElement): () => void {
  const level = (e: Event) => {
    const row = (e.target as Element | null)?.closest?.<HTMLElement>(TREE_ROWS);
    if (row && tree.contains(row)) layer.style.setProperty("--tree-hl-depth", row.dataset.depth ?? "1");
  };
  tree.addEventListener("pointerover", level);
  tree.addEventListener("focusin", level, true);
  const stop = glide(tree, layer, { rows: TREE_ROWS, follow: "hover" });
  return () => {
    stop();
    tree.removeEventListener("pointerover", level);
    tree.removeEventListener("focusin", level, true);
  };
}
