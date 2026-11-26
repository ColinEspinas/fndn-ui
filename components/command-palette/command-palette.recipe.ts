import { tv, type VariantProps } from "../lib/tv";

/* command-palette — the Search panel in a bare Dialog pinned near the top: ⌘K / Ctrl K anywhere
 * opens it, typing filters every command and page of the app, Enter runs one and closes it.
 *
 * One surface (house rule: never a box in a box): the Dialog is only the frame (position, focus
 * trap, dimmed page) and the Search's own panel is the window, given the window's radius and the
 * overlay's shadow here. It opens and closes at once, from the pointer too (Dialog `instant`): a
 * palette is used many times a day. The root holds no box of its own (display: contents); the
 * Search is the real Search, marked data-command-palette="search". */

export const commandPalette = tv({
  slots: {
    base: "contents",
    search: [
      "w-full max-w-none",
      "[&>[data-slot=search-panel]]:rounded-window [&>[data-slot=search-panel]]:shadow-overlay",
    ],
  },
});

export type CommandPaletteRecipeProps = VariantProps<typeof commandPalette>;
