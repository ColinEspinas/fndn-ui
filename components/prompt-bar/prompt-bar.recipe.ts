import { tv, type VariantProps } from "../lib/tv";
import { popup } from "../lib/popup";
import { option } from "../lib/option";
import { glideLayer } from "../lib/glide";

/* prompt-bar — the composer of an agent surface.
 * The model picker is our Select (sm, ghost), the attach menu our Menu, attach / dictate / send are
 * Buttons (sm, square; attach and dictate ghost + muted, send primary) whose shape follows the bar
 * (dictate is a <button> with the button recipe's classes: its level bars must be the button's own
 * flex item, and Button puts children in its label part); only their place in the row and the bar's own states are passed to them here (`attach`, `model`,
 * `dictate`, `send`). The @ and / lists live in a portal (fixed over the composer, placed by
 * placeList in prompt-suggest.ts) and compose the shared popup and option recipes and glideLayer (lib/glide.ts).
 *
 * Focus changes nothing on the composer: a field inside a composite surface shows the caret and
 * nothing else. The pill settles on its 24px radius as the text wraps: that
 * moves only while someone writes (focus inside), never on first paint.
 *
 * Attachments are the real Tag (neutral, with a remove button and its tooltip);
 * `attachment` is what the bar adds to each. Parts rendered by other components are marked
 * data-prompt-bar="attach|attach-trigger|dictate|send|attachment|attachment-remove|empty".
 * The keyframes of the dictation level bars are in base.css. */

const row = option();

export const promptBar = tv({
  slots: {
    base: "flex flex-col min-w-0 max-w-full",
    /* the bordered surface */
    composer: [
      "relative isolate flex flex-col gap-1.5 p-1.5",
      "border border-line rounded-window bg-surface shadow-card",
      "focus-within:motion-radius-base-out",
      /* while the row switches layout its height follows the controls (flipRow in prompt-bar.logic.ts
       * holds the old height, then sets the new one).
       * fndn-check-ok: the composer has to change height when the controls drop to a second row;
       * it moves with them, over duration.move */
      "data-[flip=to]:motion-size-move",
    ],
    /* the send sweep paints behind the content, inside the composer's shape */
    sweep: "absolute inset-0 -z-1 w-full h-full rounded-[inherit] pointer-events-none",
    attachments: "flex flex-wrap gap-1.5 max-h-24 overflow-y-auto overscroll-contain pt-0.5 px-0.5 pb-0",
    /* an attachment added while someone works in the bar (focus inside) pops in; one present at first
     * paint, or already there when focus comes back, does not move. The name stops at 144px. */
    attachment: [
      "motion-opacity-popup motion-transform-popup",
      "[[data-slot=prompt-bar-composer]:focus-within_&]:starting:opacity-0 [[data-slot=prompt-bar-composer]:focus-within_&]:starting:scale-popup",
      /* the name */
      "[&>[data-slot=tag-label]]:max-w-36",
    ],
    /* one line: [attach | input | model | dictate | send] */
    /* when the layout switches (expanded), flipRow puts each moved child back where it was
     * (data-flip="from": no transition) and lets it travel to its new place (data-flip="to":
     * translate over duration.move, out-strong). Typing triggers it, so it is not keyboard-instant;
     * a switch mid-way retargets from where things are. */
    row: [
      "grid grid-cols-[28px_minmax(0,1fr)_auto_28px_28px] [align-items:end] gap-x-1 gap-y-1.5",
      "[&>[data-flip=from]]:transition-none [&>[data-flip=to]]:motion-transform-move",
      "pointer-coarse:grid-cols-[36px_minmax(0,1fr)_auto_36px_36px]",
    ],
    attach: "col-start-1 row-start-1",
    attachTrigger: "pointer-coarse:size-9",
    /* grows with its content, then scrolls; a placeholder ends in an ellipsis instead of growing the
     * bar to two lines; under 16px iOS zooms into the field. Author text, the placeholder included
     * (unicode-bidi does not inherit into it), takes its direction from its own first letter, so
     * "Ask about this code…" keeps its ellipsis at the end on a right-to-left page */
    input: [
      "row-start-1 block w-full min-w-0 min-h-7 max-h-[100px] px-1 py-[5px]",
      "border-0 bg-transparent resize-none outline-none",
      "[font-family:inherit] [font-style:inherit] [font-weight:inherit] [font-stretch:inherit] [font-variant:inherit]",
      "text-sm leading-[18px] text-ink placeholder:text-ink-3",
      /* direction from the text, alignment from the page: an English placeholder on a right-to-left
       * page keeps its "…" at its end and still starts on the page's side (as names do) */
      "[unicode-bidi:plaintext] placeholder:[unicode-bidi:plaintext] [&:dir(ltr)]:text-left [&:dir(rtl)]:text-right",
      "wrap-anywhere overflow-y-auto overscroll-contain [field-sizing:content]",
      "placeholder-shown:overflow-hidden placeholder-shown:whitespace-nowrap placeholder-shown:text-ellipsis",
      "pointer-coarse:min-h-9 pointer-coarse:py-[7px] pointer-coarse:text-[16px] pointer-coarse:leading-[22px]",
    ],
    model: "col-start-3 row-start-1 min-w-0 [&_[data-slot=select-trigger]]:max-w-full",
    /* dictation keeps its accent tint while it listens */
    dictate: [
      "col-start-4 row-start-1 pointer-coarse:size-9",
      /* while it listens the icon gives way to the level bars */
      "[&[aria-pressed=true]>[data-slot=button-icon]]:hidden",
      "aria-pressed:bg-accent-tint aria-pressed:text-accent-ink aria-pressed:hover:bg-accent-tint aria-pressed:hover:text-accent-ink",
    ],
    /* level bars replace the microphone while listening (loop decision: reduced motion holds them
     * still, the pressed button and the placeholder already say it is listening) */
    bars: "hidden items-center gap-[2.5px] h-3.5 [[aria-pressed=true]_&]:inline-flex",
    /* their loop, each a beat behind the last (the keyframes are in base.css;
     * loops may name their own timing). Under reduced motion they hold still at three heights. */
    bar: [
      "w-[2.5px] h-full rounded-pill bg-current [transform:scaleY(0.4)] animate-[fndn-prompt-bar-level_900ms_ease_infinite]",
      "nth-2:animate-[fndn-prompt-bar-level_900ms_ease_150ms_infinite] nth-3:animate-[fndn-prompt-bar-level_900ms_ease_300ms_infinite]",
      "motion-reduce:animate-none motion-reduce:nth-2:[transform:scaleY(1)] motion-reduce:nth-3:[transform:scaleY(0.7)]",
    ],
    /* while there is nothing to send it is a grey square (not the faded disabled button) */
    send: [
      "col-start-5 row-start-1 pointer-coarse:size-9",
      "disabled:bg-line-strong disabled:text-ink-2 disabled:shadow-none disabled:opacity-100",
    ],
    /* suggestion lists: the shared popup surface. They open from typing, so they show at once. The
     * positioner is not a Zag part: it carries data-scope + data-part="positioner" for the stacking. */
    positioner: "",
    /* rows carry two runs of text: the shared option row's lg size (the empty row takes it too) */
    list: [popup(), "flex flex-col [--option-height:36px]"],
    /* the listbox scrolls inside the popup, above the footer */
    options: "relative min-h-0 overflow-y-auto overscroll-contain outline-none",
    /* the one gliding highlight; the popup's 4px is the inset */
    highlight: [glideLayer, "inset-x-0"],
    option: row.base(),
    optionIcon: row.icon(),
    optionLabel: row.text(),
    optionDescription: row.description(),
    footer: "shrink-0 mt-1 pt-1.5 px-2 pb-1 border-t border-line text-2xs text-ink-2",
  },
  variants: {
    /* radius only. pill: fully round while it is one line; once it holds more, 24px */
    shape: {
      rounded: {},
      pill: {
        composer: "rounded-pill has-[[data-slot=prompt-bar-attachments]]:rounded-[24px]",
        attachments: "px-1",
      },
    },
    /* the text wraps or has a newline: the input takes the first row, the controls the second */
    expanded: {
      false: { input: "col-start-2" },
      true: {
        row: "grid-cols-[28px_auto_minmax(0,1fr)_28px_28px] pointer-coarse:grid-cols-[36px_auto_minmax(0,1fr)_36px_36px]",
        input: "col-[1/-1]",
        attach: "row-start-2",
        model: "col-start-2 row-start-2 [justify-self:start]",
        dictate: "row-start-2",
        send: "row-start-2",
      },
    },
  },
  compoundVariants: [{ shape: "pill", expanded: true, class: { composer: "rounded-[24px]" } }],
  defaultVariants: { shape: "rounded", expanded: false },
});

export type PromptBarRecipeProps = VariantProps<typeof promptBar>;
