import { tv, type VariantProps } from "../lib/tv";

/* card — white surface on the hairline ring. Elevation picks the shadow stack; overlay also takes
 * the window radius. The header wraps: whatever holds the title may shrink and keeps at least
 * 10rem beside the actions, which drop to a line of their own rather than squeeze the title.
 * No motion. Each part is its own adapter component (CardHeader, CardTitle …),
 * marked data-slot="card-<part>"; the first slot is `base`. */

export const card = tv({
  slots: {
    base: "flex flex-col min-w-0 rounded-card bg-surface text-ink shadow-card overflow-clip",
    header: [
      "flex flex-wrap items-center gap-2 py-2.5 px-3 border-b border-solid border-b-line",
      "*:min-w-0 [&>[data-slot=card-title]]:flex-[1_1_10rem] [&>:has(>[data-slot=card-title])]:flex-[1_1_10rem]",
    ],
    title: "m-0 text-sm font-medium text-ink wrap-anywhere [unicode-bidi:plaintext] [text-align:match-parent]",
    description: "m-0 text-xs text-ink-2 wrap-anywhere [unicode-bidi:plaintext] [text-align:match-parent]",
    body: "p-3 wrap-break-word",
    footer: "flex flex-wrap items-center gap-2 p-2.5 border-t border-solid border-t-line bg-inset",
  },
  variants: {
    elevation: {
      hairline: { base: "shadow-hairline" },
      card: { base: "shadow-card" },
      raised: { base: "shadow-raised" },
      overlay: { base: "shadow-overlay rounded-window" },
    },
    inset: { true: { base: "bg-inset" } },
  },
  defaultVariants: { elevation: "card" },
});

export type CardRecipeProps = VariantProps<typeof card>;
