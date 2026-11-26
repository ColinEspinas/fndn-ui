import { tv, type VariantProps } from "../lib/tv";

/* entity-chip — monogram (our avatar, 16px, round, aria-hidden) + name in a soft field pill.
 * Names a supplier, person or record inside running text. Softer than a status pill, not a mono
 * token (see chip). A name longer than the container truncates at the end; the root carries it as
 * a title. The chip's default avatar fill is orange (--fndn-avatar-color, which the adapter's
 * `color` replaces on the avatar itself).
 *
 * No motion. The avatar is the real Avatar. */

export const entityChip = tv({
  slots: {
    base: [
      /* the inline margins stay inside the container */
      "inline-flex shrink-0 items-center gap-1 max-w-[calc(100%-4px)] mx-0.5 py-px ps-[3px] pe-1.5",
      "rounded-pill bg-field shadow-hairline align-middle whitespace-nowrap [--fndn-avatar-color:var(--fndn-orange)]",
    ],
    /* a name or signed value reads in its own direction on either page ("-4.41%" stays "-4.41%") */
    name: "min-w-0 overflow-hidden text-ellipsis text-xs font-medium leading-[1.5] text-ink [unicode-bidi:plaintext]",
  },
});

export type EntityChipRecipeProps = VariantProps<typeof entityChip>;
