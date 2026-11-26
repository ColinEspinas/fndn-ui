import { tv, type VariantProps } from "../lib/tv";

/* rating — pick a score out of a few stars (Ark UI rating-group).
 *   md (default)  24px cells · 20px stars      sm  18px cells · 14px stars
 * The cell heights are the switch's (md 24, sm 18). Each item holds two stars in one grid cell: the
 * empty one in line-strong and the filled one in ink over it, shown when the engine highlights
 * the item (the value, or the hover preview), clipped to its first half for a half star (the
 * inline start, so it mirrors right-to-left). The fill fades fast under a pointer and is instant
 * from the keyboard (kbd-instant). A press gives the star a little, as the switch's thumb does.
 *
 * Touch: on a coarse pointer each cell's hit area reaches above and below it to 40px; side by
 * side the cells stay as wide as they look. */
export const rating = tv({
  slots: {
    base: "flex flex-col gap-1.5 min-w-0",
    label: "text-sm font-medium text-ink [overflow-wrap:anywhere] [unicode-bidi:plaintext]",
    control: "inline-flex flex-wrap items-center self-start max-w-full",
    item: [
      "relative grid place-items-center rounded-chip text-line-strong cursor-pointer",
      "[&>svg]:[grid-area:1/1]",
      "[&>svg:nth-child(2)]:text-ink [&>svg:nth-child(2)]:opacity-0 [&>svg:nth-child(2)]:motion-opacity-fast [&>svg:nth-child(2)]:kbd-instant",
      "data-highlighted:[&>svg:nth-child(2)]:opacity-100",
      "data-half:ltr:[&>svg:nth-child(2)]:[clip-path:inset(0_50%_0_0)] data-half:rtl:[&>svg:nth-child(2)]:[clip-path:inset(0_0_0_50%)]",
      "motion-transform-press [:root:not([data-fndn-input=keyboard])_&:not([data-readonly])]:active:squeeze-press-sm",
      "data-disabled:cursor-default data-readonly:cursor-default",
      "pointer-coarse:after:content-[''] pointer-coarse:after:absolute pointer-coarse:after:inset-x-0",
    ],
  },
  variants: {
    size: {
      md: { item: "size-6 text-[20px] pointer-coarse:after:-inset-y-2" },
      sm: { item: "size-[18px] text-[14px] pointer-coarse:after:-inset-y-[11px]" },
    },
    disabled: {
      true: { base: "opacity-50 pointer-events-none" },
    },
  },
  defaultVariants: { size: "md", disabled: false },
});

export type RatingRecipeProps = VariantProps<typeof rating>;
