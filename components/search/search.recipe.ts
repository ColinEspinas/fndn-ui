import { tv, type VariantProps } from "../lib/tv";
import { option } from "../lib/option";
import { glideLayer } from "../lib/glide";

/* search — inline command search: the field and its results share one raised card.
 * Behaviour comes from the Zag combobox machine, kept open (role=combobox on the field,
 * role=listbox on the list, data-highlighted on the option the keyboard or pointer is on).
 *
 * Focus: the field shows no ring and the row's rule stays `line`; the blinking caret
 * is the focus indicator. The row only drops its hover tint while you type in it: a field focused
 * at mount changes nothing, so nothing plays on first paint.
 *
 * Rows may come in groups, each under its label (the option row's group label); a row may lead
 * with an icon and end with a note (meta) and a keyboard shortcut (the real Kbd, boxed). The
 * highlight glides between neighbouring rows and moves at once across a group label.
 *
 * Results change on every keystroke, so they never animate in; one highlight (the shared
 * glideLayer of lib/glide.ts) glides between them, under the pointer and the keyboard alike. Rows compose the
 * shared option row (lib/option.ts). The clear button is a Button (ghost, xs, square, muted) and the
 * empty state is the system's EmptyState (block, centred), marked data-search="clear|empty"; only
 * their placement is passed here. */

const row = option();

export const search = tv({
  slots: {
    base: "flex w-full max-w-[288px] flex-col items-stretch",
    panel: "w-full overflow-hidden rounded-card bg-surface shadow-raised",
    /* field row — the input fills it, so a click anywhere in the row focuses the field. With no
     * rows and the empty state hidden too (nothing to list at all) its rule has nothing to divide. */
    bar: [
      "relative flex h-10 items-center border-b border-line motion-colors-fast",
      "hover:not-focus-within:bg-hover",
      "[&:has(~[data-slot=search-list][data-empty]~[data-slot=empty-state][hidden])]:border-b-transparent",
    ],
    /* the magnifier: decorative, never intercepts the pointer */
    icon: "absolute inset-y-0 start-3 my-auto shrink-0 size-[1em] text-[14px] leading-none align-[-0.125em] text-ink-3 pointer-events-none",
    /* the field takes the font of the page (font: inherit, written out so the size below wins);
     * under 16px iOS zooms the page when the field takes focus */
    input: [
      "w-full min-w-0 h-full m-0 border-0 py-0 ps-[34px] pe-10 bg-transparent text-ink",
      "[font-family:inherit] [font-style:inherit] [font-weight:inherit] [font-stretch:inherit] [font-variant:inherit] leading-[inherit]",
      "text-sm tracking-[inherit] text-start outline-none placeholder:text-ink-3",
      "pointer-coarse:text-[16px]",
    ],
    /* the clear Button at the end of the row; it fades in as it appears after mount (ready), and
     * is simply there when the search mounts with a query */
    clear: "absolute inset-y-0 end-2 my-auto",
    /* no rows (the engine marks the list data-empty): the list takes no room */
    list: [
      "relative flex flex-col max-h-[268px] overflow-y-auto overscroll-x-contain p-1 outline-none",
      "data-empty:p-0 pointer-coarse:max-h-[332px]",
    ],
    highlight: [glideLayer, "inset-x-1"],
    /* a run of rows under one label (role=group); the label never takes the highlight */
    group: "flex flex-col",
    groupLabel: row.label(),
    item: [row.base(), "shrink-0"],
    itemIcon: row.icon(),
    itemText: row.text(),
    itemMeta: row.meta(),
    /* the shortcut is the real Kbd (boxed), marked data-search="item-shortcut"; only its place here */
    itemShortcut: "shrink-0",
    /* the empty state is the real EmptyState (data-search="empty"), which styles itself */
    empty: "",
  },
  variants: {
    /* set after the first render: the clear button's fade-in is armed, so a search mounted with a
     * query shows it at once (nothing plays on first paint) */
    ready: { true: { clear: "starting:opacity-0" } },
  },
});

export type SearchRecipeProps = VariantProps<typeof search>;
