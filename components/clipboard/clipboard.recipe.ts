import { tv, type VariantProps } from "../lib/tv";

/* clipboard — copy a value: the code block's Copy button, on its own or at the end of a read-only
 * field that shows the value (an API key, a link). Behaviour comes from the Zag clipboard machine
 * (data-copied while the copied state lasts).
 *
 * The trigger is the real Button with two states in one cell (the Button's swapped prop): Copy
 * then Copied, the icons and labels cross-fading, tinted green while copied, as the code block's.
 *   button  the code block's Copy button: ghost, xs, rounded, muted, with its label
 *   field   the real Input (read-only) with an icon-only Copy button 4px inside its end; the
 *           Input keeps room for it (24px button + 4px + 6px), so a long value is cut before it
 * The change is announced through a visually hidden status region. */

export const clipboard = tv({
  slots: {
    base: "inline-flex flex-col gap-1.5 min-w-0 max-w-full",
    label: "text-sm font-medium text-ink",
    control: "relative flex min-w-0",
    input: "pe-[34px]",
    trigger: "",
    status: "sr-only",
  },
  variants: {
    variant: {
      button: {},
      field: {
        base: "flex",
        trigger: "absolute inset-y-0 end-1 my-auto",
      },
    },
    /* the Copied state: green, as the code block's */
    copied: {
      true: { trigger: "text-green!" },
    },
    /* the Input's sizes (lib/control.ts); the button keeps its inset from the field's edge */
    size: {
      xs: {},
      sm: {},
      md: {},
      lg: {},
    },
  },
  compoundVariants: [
    { variant: "field", size: "xs", class: { input: "pe-[28px]", trigger: "end-0" } },
    { variant: "field", size: "sm", class: { input: "pe-[30px]", trigger: "end-0.5" } },
    { variant: "field", size: "lg", class: { input: "pe-[36px]", trigger: "end-1.5" } },
  ],
  defaultVariants: { variant: "button", size: "md" },
});

export type ClipboardRecipeProps = VariantProps<typeof clipboard>;
