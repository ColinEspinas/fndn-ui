import { tv, type VariantProps } from "../lib/tv";

/* tag — the squarer, bordered label of tables and fields, in neutral, accent or one of the eight
 * tag hues; optionally removable. Never wraps, never shrinks. Sizes: md 24px (default) · sm 22px.
 * Shape: rounded (radius.control, radius.chip at sm) by default, pill in a pill-shaped host.
 *
 * Every tone sets --_hue only: the fill (14%), the 1px border (30%) and the text (62% with ink)
 * all mix from it; dark: a richer fill and border and lighter text. The dot takes the hue.
 * An icon part may stand before the label (an attachment's file glyph); it takes the dot's place.
 * variant outline (Linear's labels): the hue is only the dot; the box is neutral (no fill, the
 * strong hairline, ink-2 text), so many labels of many hues sit quietly in a row. The adapters
 * show the dot in this look (unless an icon takes its place).
 * Variant order matters: tone < variant < size < shape < removable (a later key wins).
 * The remove button is the real Button, marked data-tag="remove"; its restyling is the `remove`
 * slot below, passed as className, and its shape follows the tag's. */

export const tag = tv({
  slots: {
    base: [
      "[--_hue:var(--fndn-ink-3)]",
      "inline-flex shrink-0 items-center gap-[5px] max-w-full h-6 px-[7px] rounded-control",
      "border border-solid border-[color:color-mix(in_srgb,var(--_hue)_30%,var(--fndn-surface))]",
      "text-sm font-normal leading-none whitespace-nowrap",
      "bg-[color:color-mix(in_srgb,var(--_hue)_14%,var(--fndn-surface))] text-[color:color-mix(in_oklch,var(--_hue)_62%,var(--fndn-ink))]",
      "[:is(.dark,[data-theme=dark])_&]:text-[color:color-mix(in_srgb,var(--_hue)_70%,var(--fndn-ink))]",
      "[:is(.dark,[data-theme=dark])_&]:bg-[color:color-mix(in_srgb,var(--_hue)_26%,var(--fndn-surface))]",
      "[:is(.dark,[data-theme=dark])_&]:border-[color:color-mix(in_srgb,var(--_hue)_34%,var(--fndn-surface))]",
    ],
    /* a tag longer than the room truncates at the end of its own text; the 2px block padding,
     * taken back by the margin, keeps descenders out of the clip */
    label: "min-w-0 -my-0.5 py-0.5 overflow-hidden text-ellipsis [unicode-bidi:plaintext]",
    dot: "shrink-0 size-1.5 rounded-[50%] bg-[color:var(--_hue)]",
    icon: "inline-flex shrink-0 text-[12px] [&>[data-slot=icon]]:size-[1em] [&>svg]:size-[1em]",
    /* on the Button: tints of the tag's own colour, so they read on every hue. Under a finger
     * the hit area reaches 36px (32px at sm); the tag does not grow. */
    remove: [
      "-ms-0.5 text-inherit",
      "hover:bg-[color:color-mix(in_srgb,currentColor_12%,transparent)] active:bg-[color:color-mix(in_srgb,currentColor_22%,transparent)]",
      "pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 pointer-coarse:after:content-['']",
    ],
  },
  variants: {
    tone: {
      neutral: {},
      accent: { base: "[--_hue:var(--fndn-accent)]" },
      blue: { base: "[--_hue:var(--fndn-tag-blue)]" },
      green: { base: "[--_hue:var(--fndn-tag-green)]" },
      orange: { base: "[--_hue:var(--fndn-tag-orange)]" },
      red: { base: "[--_hue:var(--fndn-tag-red)]" },
      purple: { base: "[--_hue:var(--fndn-tag-purple)]" },
      cyan: { base: "[--_hue:var(--fndn-tag-cyan)]" },
      yellow: { base: "[--_hue:var(--fndn-tag-yellow)]" },
      pink: { base: "[--_hue:var(--fndn-tag-pink)]" },
    },
    /* tint (default): the box takes the hue. outline: a neutral box, the hue only in the dot */
    variant: {
      tint: {},
      outline: {
        base: [
          "bg-transparent border-line-strong text-ink-2",
          "[:is(.dark,[data-theme=dark])_&]:bg-transparent [:is(.dark,[data-theme=dark])_&]:border-line-strong [:is(.dark,[data-theme=dark])_&]:text-ink-2",
        ],
      },
    },
    /* sm — 22px, for table cells and dense rows */
    size: {
      md: {},
      sm: {
        base: "h-[22px] px-1.5 text-[11.5px]",
        icon: "text-[11px]",
        remove: "size-5 min-h-5 pointer-coarse:after:-inset-2",
      },
    },
    /* radius only */
    shape: {
      rounded: {},
      pill: { base: "rounded-pill" },
    },
    /* the tag grows to 26px to hold the 24px button inside its 1px border; at sm it stays 22px */
    removable: { true: { base: "h-[26px] pe-0" } },
  },
  compoundVariants: [
    { shape: "rounded", size: "sm", class: { base: "rounded-chip" } },
    { removable: true, size: "sm", class: { base: "h-[22px]" } },
  ],
  defaultVariants: { tone: "neutral", variant: "tint", size: "md", shape: "rounded" },
});

export type TagRecipeProps = VariantProps<typeof tag>;
