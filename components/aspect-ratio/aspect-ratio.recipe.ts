import { tv, type VariantProps } from "../lib/tv";

/* aspect-ratio — a box that keeps a width-to-height ratio (--fndn-aspect-ratio, set by the adapter
 * from its ratio prop). Its width is its container's; its height follows the ratio. overflow
 * hidden also drops the automatic minimum size, so content taller than the box never stretches
 * it. Direct children fill the box; media cover it. No look of its own (no radius, no fill): the
 * caller frames it. No motion. */

export const aspectRatio = tv({
  base: [
    "relative w-full overflow-hidden [aspect-ratio:var(--fndn-aspect-ratio,16/9)]",
    "[&>*]:size-full [&>:is(img,video,iframe)]:block [&>:is(img,video)]:object-cover [&>iframe]:border-0",
  ],
});

export type AspectRatioRecipeProps = VariantProps<typeof aspectRatio>;
