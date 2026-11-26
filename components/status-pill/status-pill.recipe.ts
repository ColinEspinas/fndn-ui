import { tv, type VariantProps } from "../lib/tv";

/* status-pill — tinted pill with a leading status dot. Never wraps, never shrinks.
 * Sizes: md 24px (default) · sm 22px. (The squarer, bordered label of tables and fields is the
 * Tag, its own component.) A mark (18px circle with a check) replaces the dot for a finished
 * state; it pops in when a painted pill turns finished (data-enter arrives after the first paint, lib/paint.ts, and
 * @starting-style only applies to an element that has just appeared), never on first paint.
 * A trailing icon part may stand after the label.
 *
 * Every tone sets --_hue; the mark takes its colour from it, and blue (a status with no tint pair
 * of its own, such as "beta") mixes its fill and text from it.
 * Variant order matters: dotTone < tone < size < mark (a later key wins). */

const MIXED = "bg-[color:color-mix(in_srgb,var(--_hue)_14%,var(--fndn-surface))] text-[color:color-mix(in_oklch,var(--_hue)_62%,var(--fndn-ink))]";

export const statusPill = tv({
  slots: {
    base: [
      "[--_hue:var(--fndn-ink-3)]",
      "inline-flex shrink-0 items-center gap-1.5 max-w-full h-6 px-2.5 rounded-pill",
      "text-sm font-medium leading-none whitespace-nowrap bg-inset text-ink-2",
    ],
    /* a status longer than the room truncates at the end of its own text; the 2px block padding,
     * taken back by the margin, keeps descenders out of the clip */
    label: "min-w-0 -my-0.5 py-0.5 overflow-hidden text-ellipsis [unicode-bidi:plaintext]",
    dot: "shrink-0 size-1.5 rounded-[50%] bg-ink-3",
    trailing: "inline-flex shrink-0 text-[12px] [&>[data-slot=icon]]:size-[1em] [&>svg]:size-[1em]",
    mark: [
      "inline-flex shrink-0 size-[18px] items-center justify-center rounded-[50%]",
      "bg-[color:var(--_hue)] text-on-accent",
      "[&>[data-slot=icon]]:size-[11px] [&>[data-slot=icon]]:text-[11px] [&>svg]:size-[11px] [&>svg]:text-[11px]",
      /* the pop-in, only inside a painted pill; reduced motion: popup-scale is 1, so it only fades */
      "[[data-slot=status-pill][data-enter]>&]:motion-opacity-popup [[data-slot=status-pill][data-enter]>&]:motion-transform-popup",
      "[[data-slot=status-pill][data-enter]>&]:starting:opacity-0 [[data-slot=status-pill][data-enter]>&]:starting:scale-popup",
    ],
  },
  variants: {
    /* a neutral pill whose dot alone carries a colour (a category) */
    dotTone: {
      accent: { dot: "bg-accent" },
      green: { dot: "bg-green" },
      orange: { dot: "bg-orange" },
      red: { dot: "bg-red" },
      blue: { dot: "bg-tag-blue" },
      purple: { dot: "bg-tag-purple" },
      cyan: { dot: "bg-tag-cyan" },
      yellow: { dot: "bg-tag-yellow" },
      pink: { dot: "bg-tag-pink" },
    },
    /* the four status tones keep their tint pair; blue mixes from its tag hue */
    tone: {
      neutral: {},
      accent: { base: "[--_hue:var(--fndn-accent)] bg-accent-tint text-accent-ink", dot: "bg-accent" },
      green: { base: "[--_hue:var(--fndn-tag-green)] bg-green-tint text-green", dot: "bg-green" },
      orange: { base: "[--_hue:var(--fndn-tag-orange)] bg-orange-tint text-orange", dot: "bg-orange" },
      red: { base: "[--_hue:var(--fndn-tag-red)] bg-red-tint text-red", dot: "bg-red" },
      blue: { base: ["[--_hue:var(--fndn-tag-blue)]", MIXED], dot: "bg-[color:var(--_hue)]" },
    },
    /* sm — 22px, for table cells and dense rows */
    size: {
      md: {},
      sm: {
        base: "h-[22px] px-2 text-[11.5px]",
        trailing: "text-[11px]",
        mark: "size-4 [&>[data-slot=icon]]:size-2.5 [&>[data-slot=icon]]:text-[10px] [&>svg]:size-2.5 [&>svg]:text-[10px]",
      },
    },
    mark: { true: { base: "ps-[3px]" } },
  },
  defaultVariants: { tone: "neutral", size: "md" },
});

export type StatusPillRecipeProps = VariantProps<typeof statusPill>;
