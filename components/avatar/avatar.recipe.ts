import { tv, type VariantProps } from "../lib/tv";

/* avatar — image or initials for a person, company, source or file, round or square. Two ranges:
 * 12, 14, 16 and 20px sit inside a line of text (a chip, a cell, a mention); 24, 28, 32 and 40px
 * are the control scale's heights (xs 24 · sm 28 · md 32, and 40 for a profile header), so an
 * avatar in a list row lines up with the buttons and fields beside it. The initials are sized so
 * that two wide letters ("MC") take about two thirds of the edge at every size, clear of the rim
 * (7px in 16, 8.5 in 20, 10 in 24, 12 in 28, 13 in 32, 15 in 40); 12 and 14px show one letter,
 * about half the edge. Square corners are a quarter of the edge. The initials sit under the image
 * (one grid cell), so a slow image shows initials first
 * and a broken one (removed by the adapter; drawn as nothing even before, because alt is empty)
 * falls back. The fill comes from --fndn-avatar-color (the adapter's `color`), ink-3 by default.
 *
 * Over an image, a hairline keeps a white logo apart from a white surface: a pseudo-element on the
 * root, set by the `image` variant (the adapter knows when it renders the image part). */

export const avatar = tv({
  slots: {
    base: [
      "relative inline-grid shrink-0 size-4 overflow-hidden rounded-[50%] align-middle select-none",
      "bg-[var(--fndn-avatar-color,var(--fndn-ink-3))] text-on-accent text-[7px] font-semibold leading-none",
    ],
    initials: "grid place-items-center [grid-area:1/1] min-w-0 overflow-hidden whitespace-nowrap tracking-[-0.02em]",
    image: "[grid-area:1/1] size-full object-cover",
  },
  variants: {
    size: {
      "12": { base: "size-3 text-[6.5px]" },
      "14": { base: "size-3.5 text-[7.5px]" },
      "16": {},
      "20": { base: "size-5 text-[8.5px]" },
      "24": { base: "size-6 text-[10px]" },
      "28": { base: "size-7 text-[12px]" },
      "32": { base: "size-8 text-[13px]" },
      "40": { base: "size-10 text-[15px]" },
    },
    shape: {
      round: {},
      square: { base: "rounded-[4px]" },
    },
    image: {
      true: { base: "after:content-[''] after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_var(--fndn-line)] after:pointer-events-none" },
    },
  },
  compoundVariants: [
    { shape: "square", size: "12", class: { base: "rounded-[3px]" } },
    { shape: "square", size: "20", class: { base: "rounded-[5px]" } },
    { shape: "square", size: "24", class: { base: "rounded-[6px]" } },
    { shape: "square", size: "28", class: { base: "rounded-[7px]" } },
    { shape: "square", size: "32", class: { base: "rounded-[8px]" } },
    { shape: "square", size: "40", class: { base: "rounded-[10px]" } },
  ],
  defaultVariants: { size: "16", shape: "round", image: false },
});

export type AvatarRecipeProps = VariantProps<typeof avatar>;
