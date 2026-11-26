import { tv, type VariantProps } from "../lib/tv";

/* alert — a message that sits in the page: icon, title, description, actions. The box is the
 * card's (radius.card, shadow.card on the surface when neutral); the tones are status-pill's four
 * status tones with their tint pairs. On a tint only the icon takes the tone's colour: the title
 * and the description stay ink and ink-2, so a long message reads as well as a short one.
 *
 * The icon sits on the title's first line: its box is one line (20px) high and centres the 16px
 * glyph, so it stays put however many lines the text wraps to. The actions are Buttons (sm) in
 * the content column, under the text, so they line up with the title at any width. Static: no
 * motion, no engine. */

const DIR = "[unicode-bidi:plaintext]";

export const alert = tv({
  slots: {
    base: "flex items-start gap-2.5 min-w-0 p-3 rounded-card text-sm leading-5 text-ink",
    icon: "inline-flex shrink-0 items-center justify-center h-5 text-[16px] [&>[data-slot=icon]]:size-4 [&>svg]:size-4",
    content: "flex flex-col flex-1 min-w-0",
    title: ["font-medium text-ink wrap-anywhere", DIR],
    description: ["text-ink-2 wrap-anywhere [[data-slot=alert-title]+&]:mt-0.5", DIR],
    actions: "flex flex-wrap items-center gap-2 mt-2.5",
  },
  variants: {
    tone: {
      neutral: { base: "bg-surface shadow-card", icon: "text-ink-3" },
      accent: { base: "bg-accent-tint", icon: "text-accent" },
      green: { base: "bg-green-tint", icon: "text-green" },
      orange: { base: "bg-orange-tint", icon: "text-orange" },
      red: { base: "bg-red-tint", icon: "text-red" },
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type AlertRecipeProps = VariantProps<typeof alert>;
