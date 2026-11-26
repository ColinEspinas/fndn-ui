import { tv, type VariantProps } from "../lib/tv";

/* message — one message of a conversation with an assistant: the person's, in a bubble at the
 * end, or the assistant's, as plain text at the start with an optional avatar. A header names who
 * wrote it (name, an optional source Chip, the time); actions (Copy, Retry, Edit, Good / Bad
 * response) sit under it, shown on hover and on focus, always on touch.
 *
 * Composed: Avatar (20px, beside the header and the text), Chip (the source), Shimmer (the
 * "Thinking" status of a streaming message with nothing yet), Button (Copy, Retry, Edit: ghost xs
 * square muted, named by their Tooltips) and Toggle (Good / Bad response, which stay pressed).
 *
 * Motion. The actions fade in on hover over duration.fast (a real pointer only, group-hover is
 * gated); from the keyboard they are there at once (kbd-instant); they always take their room, so
 * showing them moves nothing. Copy cross-fades into Copied (the Button's swap). Arrivals are the
 * host thread's (chat-composer rises a new message in); nothing plays on first paint. Author text
 * keeps its own direction (plaintext); on a coarse pointer it reads at 16px. */

const PLAIN = "[unicode-bidi:plaintext]";

export const message = tv({
  slots: {
    base: "group/message flex w-full min-w-0 gap-2 text-ink",
    /* the Avatar, beside the header (the header's 20px line) */
    avatar: "shrink-0 mt-px",
    main: "flex min-w-0 flex-1 flex-col gap-1",
    header: "flex min-w-0 items-center gap-1.5 h-5 text-xs leading-none whitespace-nowrap",
    name: ["min-w-0 overflow-hidden text-ellipsis font-medium text-ink", PLAIN],
    /* the source is a Chip: it gives way first (down to 48px, cut in the end), then the name; the
     * time is never cut */
    source: "min-w-12 shrink-[100] overflow-hidden text-ellipsis whitespace-nowrap",
    time: ["shrink-0 text-ink-2 tabular-nums", PLAIN],
    body: "min-w-0",
    text: ["m-0 text-sm leading-[1.5] wrap-anywhere whitespace-pre-line pointer-coarse:text-md", PLAIN],
    status: "flex h-[21px] items-center text-sm",
    /* shown on hover and focus, always on touch; always takes its room */
    actions: [
      "kbd-instant flex items-center gap-0.5 opacity-0 motion-opacity-fast",
      "group-hover/message:opacity-100 group-focus-within/message:opacity-100",
      "pointer-coarse:opacity-100 [@media(hover:none)]:opacity-100",
    ],
  },
  variants: {
    role: {
      /* the person's message: a bubble at the end, 56px clear of the start */
      user: {
        base: "ps-14",
        main: "items-end",
        header: "justify-end",
        body: "max-w-full py-1.5 px-3 rounded-[12px] bg-field [&>[data-slot=message-text]]:leading-[1.4]",
      },
      assistant: {},
    },
    /* a chosen Good / Bad response keeps the actions shown, so the choice stays visible */
    kept: { true: { actions: "opacity-100" } },
  },
  defaultVariants: { role: "assistant", kept: false },
});

export type MessageRecipeProps = VariantProps<typeof message>;
