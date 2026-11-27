import { tv, type VariantProps } from "../lib/tv";

/* chat-composer — a fixed-height chat card: tab strip (our Tabs), a scrolling thread per tab, and
 * a composer. The card never changes shape: the open panel takes the room the composer leaves and
 * scrolls. Panels swap instantly; only a message that arrives after mount moves (watchThreads sets
 * and clears data-enter).
 *
 * Composed: Tabs (only its place in the card is passed, `tabs`), Message (each message of a
 * thread, the person's bubble and the agent's steps; marked data-chat-composer="message"), Shimmer
 * (the busy status), Button (suggestions, send; marked data-chat-composer="suggestion|send").
 * Tabs passes on no data-* attribute in React and Svelte yet, so it is unmarked. Focus on the field shows the caret and nothing
 * else: focus never recolours an edge. Author text takes its direction from its
 * own first letter (plaintext). */

const PLAIN = "[unicode-bidi:plaintext]";

export const chatComposer = tv({
  slots: {
    base: [
      "flex flex-col w-full max-w-[380px] h-[288px] min-w-0 overflow-hidden",
      "rounded-window bg-surface shadow-card text-ink",
    ],
    /* the Tabs root (fill): the strip is the card's header, the open panel the thread's scroller.
     * The Tabs' header part (an empty headerClass) is the strip's row and carries the hairline, so
     * it runs the whole width under the list and, while the strip overflows, under the all-tabs
     * menu after it (the list's edge fade never touches it). The list is flush with the card that
     * clips it, its 6px padding holds the focus ring; the menu keeps 6px from the card's edge. A
     * long name stops at 180px. */
    tabs: [
      "flex-1 min-h-0",
      "[&>[data-slot=tabs-header]]:border-b [&>[data-slot=tabs-header]]:border-line",
      "[&>[data-slot=tabs-header]>[data-slot=tabs-list]]:p-1.5 [&>[data-slot=tabs-header]>[data-tabs=more]]:pe-1.5",
      "[&_[data-slot=tabs-trigger]]:max-w-[180px]",
      "[&>[data-slot=tabs-content]]:flex-1 [&>[data-slot=tabs-content]]:min-h-0 [&>[data-slot=tabs-content]]:overflow-y-auto",
      "[&>[data-slot=tabs-content]]:pt-2.5 [&>[data-slot=tabs-content]]:px-3",
      "[&>[data-slot=tabs-content]]:pb-1 [&>[data-slot=tabs-content]]:text-ink",
      /* the panel is focusable (it scrolls) and fills the card, which clips: its ring sits inside */
      "[&>[data-slot=tabs-content]:focus-visible]:outline-offset-[-2px]",
    ],
    thread: "flex flex-col gap-2.5 min-w-0",
    /* on the Message (marked data-chat-composer="message"): one that arrives after mount rises in */
    message: "data-enter:animate-fade-up",
    composer: "flex flex-col gap-1.5 shrink-0 min-w-0 p-1.5",
    /* suggestions and the busy status share one 32px row, so swapping them never moves anything.
     * The suggestions scroll sideways, which clips them on every side: the row is 4px larger all
     * round than the 28px pills (their focus ring reaches 4px past them) and takes that back with
     * negative margins. */
    suggestions: [
      "flex items-center gap-1 min-w-0 h-9 -my-0.5 -mx-1 p-1 scroll-px-1",
      "overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
    ],
    suggestion: "max-w-[220px]",
    status: "flex items-center gap-1 min-w-0 h-8 px-2 text-xs",
    field: "flex flex-col gap-2 min-w-0 p-2.5 border border-line rounded-control bg-field cursor-text",
    /* under 16px iOS zooms into the field */
    input: [
      "block w-full min-w-0 min-h-[18px] max-h-24 m-0 p-0 border-0 bg-transparent",
      "[font-family:inherit] [font-style:inherit] [font-weight:inherit] [font-stretch:inherit] [font-variant:inherit]",
      "text-sm leading-[18px] text-ink placeholder:text-ink-3 resize-none outline-none",
      "wrap-anywhere overflow-y-auto [field-sizing:content] pointer-coarse:text-[16px] pointer-coarse:leading-[20px]",
      /* the placeholder too: unicode-bidi does not inherit into it */
      PLAIN, "placeholder:[unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
    ],
    footer: "flex items-center justify-end min-w-0",
    send: "cursor-pointer",
  },
});

export type ChatComposerRecipeProps = VariantProps<typeof chatComposer>;
