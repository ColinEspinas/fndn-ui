---
name: house-rules
description: The design rules of fndn/ui where they sharpen or override the general design skills (emil-design-eng, animate, choreograph, gestures, remove-animations, review-animations, mobile-native, break-ui). Read it before any design work on fndn/ui (a component, a part, a variant, motion, an example, a block, a showcase or the docs site), together with the general skill that fits; where the two differ, this file wins.
---

# fndn/ui house rules

The design skills in `.claude/skills/` are the general bar. This file is where fndn/ui differs from
them or is more precise; where a general skill and a rule below disagree, the rule below wins.
Each rule comes with its reason, so a case it does not fit can be argued on that reason rather
than broken quietly. A rule that changes is changed here and in the rule book that carries it.

The standards themselves are `docs/DESIGN.md` and `docs/design/motion.md`, `interaction.md`,
`accessibility.md`; the size and variant contract is in `docs/authoring.md` (Sizes and looks).

## How to use them

1. Before designing: this file, then `emil-design-eng` and the skill that fits the work
   (`animate`, `choreograph`, `gestures`, `mobile-native`, `animation-performance`).
2. Before calling it done: `review-animations/STANDARDS.md` and `break-ui`.
3. Anything bigger than one component (a showcase, a docs page, a block in its context) also goes
   through `.claude/skills/screen-review/`, and through a review by someone who did not build it:
   a screen can pass every component check and still be wrong.

## Motion

- **Keyboard actions are instant, except the gliding highlight of a list**, which glides under
  the keyboard too, because it is what shows where the highlight went. Across a group title, a
  heading or a separator it keeps gliding and passes behind it: those sit above the layer
  (`relative z-1`), like a row's text, with no background of their own. The `option` recipe does
  this for menus and lists; anything built by hand (a sidebar, a tree) does it too. Every list of
  options keeps the glide, however short, and never falls back to a per-row background.
- **A travelling indicator stays** (a segmented control's thumb, a tab's indicator), although
  `remove-animations` lists it as removable: for a pointer selection it shows where the selection
  went. From the keyboard it is instant.
- **A press scales from the pointer only**: `[:root:not([data-fndn-input=keyboard])_&:active]:scale-press`,
  with `trackModality()` running in the adapter. Space and Enter act at once, because a key press
  has no finger to answer.
- **Joined controls never scale** (a button group, a joined toggle group), neither one button
  nor the whole group: a button scaled alone pulls away from its neighbour and opens a gap at the
  join, and a whole group squashing reads as one big button. The pressed button's label and icon
  dip inside the still box instead. Each join is one hairline.
- **Nothing plays on first paint, and a mount is not an arrival.** A component never animates its
  own mount: it cannot tell a live arrival from a restored one (hydration, a navigation, a thread
  switch, a virtualized row). The code that appends an item live says so with `appear` (default
  `false`), on the agent components that show arrivals (approval card, tool chips, task rows,
  thinking state, context cards, streaming text).
- **Arrivals make room**: something inserted after the first paint opens its space (a row from
  `0fr` to `1fr` over `duration.reveal`) while it fades, so it never pushes its neighbours in one
  frame.
- **What the pointer removes gives its room back as it fades** (a table row, a tag): its space
  closes over `duration.reveal`, so the neighbours slide and nothing jumps once it is gone. From
  the keyboard it goes at once. In the tags input this is the only motion: adding (Enter, the
  delimiter, a paste), selecting and editing are instant, because they are keyboard work.
- **A drag released while still moving is a throw**: it goes on in its direction, however short
  the drag (the carousel turns the page on a flick); only a drag that has stopped settles on the
  nearest stop. Distance alone is never the test, because a quick flick never gets halfway.
- **Motion is the same in every browser, or it is not done**: no effect depends on a feature only
  some browsers have and falls back to nothing elsewhere. In the carousel, where the slides are
  decides how they are drawn, and one spring moves them for every page change, never the
  browser's smooth scroll, which differs between browsers, starts from a standstill and is slow.
- **A page set from outside travels like any other, and the indicator changes when the page is
  decided**, not when the slides arrive, so the controls never lag behind the user's intent.
- **A gesture behaves the same in every variant of a component, unless a prop says otherwise**:
  one drag turns one carousel page in every effect (`dragReach="page"`, the default; `free` goes as
  far as it is dragged), and what the controls can do a drag can do (with `loop="rewind"`, a drag
  past an end goes round). A variant changes the look, not what the hand can do.
- **Where nothing travels, a drag does not scrub**: in the carousel's `fade` a sideways drag turns
  one page with the timed cross-fade, because following the pointer would hold two slides half
  faded over each other for as long as the drag lasts.
- **An effect is big enough to be seen, and sized by what it moves**: a share of the thing's own
  size, not a fixed few pixels, so it reads the same in a small slide and a wide one (the
  carousel's parallax lags a picture by a fifth of its frame's width; layers further back lag
  more). The example of an effect shows it plainly.
- **A loop is a choice, and endless means endless**: the carousel's `loop` is `none`, `rewind`
  (the slides run back) or `endless` (the first slide follows the last, the same way; Previous on
  the first comes from the other side). On an endless strip Next never travels backwards, a dot
  goes the shorter way round, and no slide is copied: each is drawn on the turn of the strip
  nearest the scroller.
- **An overlay that mounts open is simply there**: a dialog, alert dialog, drawer, popover, hover
  card or menu open at mount has no entrance (the adapter marks it `data-mounted-open` until its
  first close, and the recipe gates every starting style on it). Opening later and closing
  animate, because only those are changes the user watches.
- **What moves by itself can be stopped**: autoplay always shows a pause control, holds under the
  pointer, with focus inside, on a hidden page and off screen, stops for good once the user turns
  a page, and never starts under reduced motion.
- **The prompt bar's send sweep is long on purpose** (`duration.sweep`, 1000ms): it is decoration
  nobody waits on, and shorter it is gone before it is seen travelling. It is the one motion above
  the 300ms ceiling.
- **Under reduced motion travel becomes a fade.** The tokens carry the reduced values; check
  `duration.press` and the scales, which are not reduced by themselves (the press scale stays on
  purpose: it is feedback under the finger, not travel).

## Layout and interaction

- **Scroll chaining**: popups, dialogs, drawers and fixed panes use `overscroll-behavior:
  contain`; a scroller in the page's flow (code block, table, list, chat, scroll area) hands the
  wheel on to the page and keeps only sideways overscroll in (`overscroll-x-contain`), so reading
  down a page never stalls over a code block.
- **Never cut the name of a choice or a number**: it wraps, or the list becomes a pager plus a
  select; only free text that is not a choice may be cut, with a `title`. (`break-ui` says this
  for numbers; here it covers names too, because a cut name cannot be told from its neighbour.) A
  select's list is sized by its longest option, not by its trigger.
- **A fixed-size control never stretches**: a width given to a labelled control sizes the whole
  row, and the control keeps its size (a switch stretched to a long label no longer reads as a
  switch).
- **Rows of chrome above content are few**: a header is one row where it can be; two rows sit
  flush, each centred between its hairlines, with the same inset at both ends.
- **Sizes and looks are separate**: `size` (xs 24 · sm 28 · md 32 · lg 36) changes dimensions
  only, on one scale for every control; a look is a `variant` (fields: `outline`, `subtle`,
  `ghost`; buttons take shadcn's names: `outline` the default, `secondary` the grey fill, `ghost`
  no fill until hovered). `ghost` means no fill for buttons and fields alike. A size that changes
  a look makes every size a different component.
- **One radius rule for controls**: `chip` up to 28px (`xs`, `sm`), `control` from 32px (`md`,
  `lg`), for fields and for rounded buttons, toggles and segmented controls alike, so a small
  button and a small select in one row have the same corners. Rows follow it too: nav and tree
  rows of 28px and under take `chip`.
- **An app chooses its shape once, in its `fndn.json`** (`"shape": "rounded"`; the tool writes it
  into the stylesheet). Buttons, toggles and segmented controls follow it through `rounded-shape`
  / `rounded-shape-sm`, those a component renders itself included; `data-shape="rounded"` on an
  element does the same for a part of a page. A component does not take a `shape` prop to pass
  one on, and a rounded screen does not repeat `shape` on each control: one setting cannot
  disagree with itself.
- **Wide things do not scale.** A scale takes a share of the width: a popup as wide as its
  trigger (select, combobox) opens along the block axis only (`popup({ drop: true })`), and a
  field or its trigger darkens on press, never scales.
- **An open ghost select stays a label**: the `hover-2` fill of an open ghost button, no ring and
  no field fill, so a row of ghost controls in a detail pane never has one that turned into a
  field. The ring is for keyboard focus.
- **Nothing the user types is dropped without a sign.** A tag typed a second time selects the tag
  that is already there, and so does a tag edited into another's text. An edit left by a click
  away or Tab is kept, as Enter keeps it; only Escape cancels.
- **A field shows one ring, its own.** A part selected inside it is a fill (the tags input's
  highlighted tag: accent fill, caret hidden), and a part edited in place keeps its box and its
  place, so nothing moves when the edit starts.
- **A row that opens never moves its own title.** Give the first line a fixed height instead of a
  minimum on a wrapping row: a minimum stretches a lone line and stops once a second line appears.
- **The controls say where the content is, however it got there**: the carousel's pager and dots
  follow the slides whoever moved them (the arrow keys after a click, the browser scrolling to a
  focused control). A drag handler does not refuse a press's default to stop text selection: that
  refuses the focus too, and the keys then act behind the component's back. Refuse `selectstart`
  and `dragstart` instead.
- **A scale keeps its proportions**: what sits inside a sized thing is checked at every size with
  the widest content, not designed at one size and stepped by eye. An avatar's two initials take
  about two thirds of the circle at every size from 16 to 40px.
- **Text that carries information is at least `ink-2`**: helper text, descriptions, hints, empty
  states, and the meta labels (IDs, timestamps, counts, units, group labels, property labels,
  column headers, navigation labels at rest). `ink-3` is about 2.5:1 to 3.5:1 and is only for placeholders,
  icons, separators, decoration and what is disabled. A meta label is quieter than what it sits
  beside by size and weight, never by a fainter grey. A muted button with a label rests in
  `ink-2`, because a label is read; only an icon-only one rests in `ink-3`.
- **A text size the type scale names is its token**: 12.5px is `text-dense`, never
  `text-[12.5px]`, so a change of scale reaches every use.
- **Direction is logical, and `check` says so**: `ms- me- ps- pe- start- end-`, never `ml-` or
  `left-`; a position that is physical on purpose is written as the property (`[left:0]`) or
  under `ltr:` / `rtl:`.
- **A tree's guides are never broken by a row**: a row's fill, its focus ring and the hover
  highlight start where the row's level starts, so none of them crosses a guide; the whole row is
  still the hit area. Guides are `line-strong` at rest, `ink-3` on the level that holds the
  selection (so the selection's folder shows at a glance), and end a little short of their last
  child.
- **A hairline that must look the same on every row is a border, not a 1px background**: at
  fractional display scales a 1px background is drawn one device pixel wide in some places and two
  in others; a border is drawn on whole device pixels.
- **The strip at the top of a screen is the PageHeader**, never built by hand: title,
  description, back link, actions; `size="pane"` for the one-row header of a pane.
- **One surface, never a box in a box** (the command palette is a bare Dialog around the Search
  panel). A menu, a select's or a combobox's list and a sub-menu stand 4px clear of what they open
  from; a popover, a hover card and a tooltip 6px.
- **A status is a `status-pill`; a label attached to something is a `tag`.**
- **Dark is composed, not inverted**: a step between two surface tokens reads as clearly in dark
  as in light (compare contrast ratios, not lightness numbers; the selected attached tab must
  stand off its strip in both). Fix the token, not the component.

## Content

- Examples and showcases are what a model learns from: **realistic product UI** (project
  settings, deploy logs, billing, code review), one idea per example, named after the situation,
  real-looking data, code a developer would paste. `docs/examples-guide.md` has the details.

## The docs site

- **No transition between docs pages, and no flicker**: the new page is complete in its first
  frame, and the chosen framework holds from the first paint and across pages.
- **The content column is capped and centred** on every page kind (`mx-auto` on the column; the
  overview's column is wider).
- **View options act on the whole page**, so they sit in the top bar, not on a component.
  Components and blocks are listed apart; the overview shows each one live.
- **A preview sits on a solid surface or canvas**: parts without a fill of their own read as
  broken over a dotted ground.
- **The props panel drives two-way props on the live component**, so a value set there (a
  carousel's `page`) travels as it would in an app.
