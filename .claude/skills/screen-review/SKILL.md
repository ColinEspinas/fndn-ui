---
name: screen-review
description: Review or build a whole screen made from fndn/ui (a showcase app, a docs page, a block shown in a product context), judged against the real product it imitates. Use whenever you build, critique or fix anything bigger than one component. Complements the component-level skills (emil-design-eng, animate, review-animations), which judge one component at a time and miss composition, density and the weight of chrome against content.
---

# Screen review

The component skills judge one piece at a time; a screen can pass all of them and still look
wrong. This skill judges the whole screen the way a person sees it at first glance. Read
`docs/DESIGN.md` and the `docs/design/` book that fits first; use `impeccable` (critique /
audit) for the general method, if it is installed, and this skill for what is specific to fndn/ui.

What a screen built from correct components typically gets wrong: code that wraps in an editor,
32px tree rows in an explorer, browser tabs that do not attach to the toolbar, a gridded card table
for an issue list, grey filled boxes for pressed toggles, docs-site pieces (a copy button, a code
block's tab strip, a pill toggle) standing in for product chrome, a box inside a box, and something
that plays on first paint.

## The method

1. **Name the real product** the screen imitates (VS Code / Zed, Chrome / Arc, Linear / GitHub
   issues, Stripe dashboard …) and look at it, or a public screenshot of it, at the same width.
   Judge by that comparison, not by taste in the abstract.
2. **Measure, do not eyeball**: row heights, text sizes of chrome versus content, the number of
   filled and pill-shaped elements. Content text is the largest thing in its region; chrome is
   the quietest.
3. **The three heaviest marks** on the screen (fill, size, colour, motion): each must be the
   primary action or the content. Anything else gets quieter.
4. **Density by product**: editors and browsers use the `xs` / `sm` sizes (24 / 28px rows,
   12–13px text); trackers and dashboards `sm` (single-line rows); `md` / `lg` are for forms,
   settings and docs.
5. **Pick a component by its look, not its name**: read each component's spec (sizes, variants,
   slots) and choose the one meant for this context. A docs look (a card around a table, a pill,
   a copy button, a code block's file tabs) inside product chrome is a finding.
6. **Wrap or cut the product's way**: no wrapping where the real product truncates or scrolls
   (code lines, tab titles, table rows); no truncation where `docs/DESIGN.md` says wrap (names of
   choices, numbers).
7. **The first frame**: nothing moves, scrolls or spins on first paint; every pane shows its
   start (not scrolled into the middle of a message).
8. **State the product's way**: an active tab joins its surface; a pressed layout toggle changes
   its ink, not its background; a selected row is a tint; a single item needs no pager.
9. **One batched pass** over light and dark at 1280 and 1536, and 390, right to left, at a
   device pixel ratio of 1.25 as well as 1 (`launch({ dpr })` in `scripts/qa/cdp.mjs`): at 390
   replace desktop patterns (tab strips, tables, side panes) with the phone's own (sheets, list
   rows, bottom bars).
10. **App or component?** Report every finding as one or the other. A component gap is fixed in
    the component (spec, recipe, three adapters, test), never patched in the app.

## Before calling a screen done

An independent review: someone (a person or an agent) who did not build the screen runs this
method and writes the findings; the builder fixes them; the reviewer checks again. Self-review is
not enough for screens.
