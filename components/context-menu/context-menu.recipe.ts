import { tv, type VariantProps } from "../lib/tv";

/* context-menu — the Menu opened on an area. The popup, its rows, the gliding highlight and every
 * motion are the menu recipe's (the adapter renders the Menu's own panel); the area is the
 * caller's and takes no look. On a coarse pointer a long press must reach the menu, not start a
 * text selection or the system callout. */

export const contextMenu = tv({
  base: "block pointer-coarse:select-none pointer-coarse:[-webkit-touch-callout:none]",
});

export type ContextMenuRecipeProps = VariantProps<typeof contextMenu>;
