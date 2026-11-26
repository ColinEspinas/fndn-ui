## Interaction

How things respond to pointer, touch and keyboard, and how they hold up with real data. Timings
and curves are in `docs motion`; keys and names are in `docs accessibility`.

### States

Every interactive part defines the same states, in this order of precedence. **State lives in
attributes, never in class names**: the engine keeps its attributes true, and a copy would drift.

| State | Expressed by | Rule |
| --- | --- | --- |
| Rest | The base classes | |
| Hover | `hover:` (CSS: `:hover` inside `@media (hover: hover) and (pointer: fine)`) | Colour or opacity only. Touch has no hover, and an ungated hover sticks after a tap. |
| Press | `active:` | Always present: it is the only feedback touch gets. See Press below. |
| Focus | `:focus-visible` | The shared ring. See Focus below. |
| Selected, on | `aria-selected`, `aria-checked`, `aria-pressed`, `aria-current`, or the engine's `data-state` | |
| Expanded | `aria-expanded` on the trigger, `data-state="open"` on what it reveals | |
| Highlighted | `data-highlighted`, set by the engine on the option the keyboard or pointer is on | The row paints nothing; the list's glide layer travels to it. |
| Disabled | `disabled`, `aria-disabled="true"` or `data-disabled` | `opacity-50`, `pointer-events-none`, `cursor-default`: neither hovers nor presses. |

### Press

- **Buttons, chips, pills, segments, tabs and icon buttons scale** to `scale-press` (0.97) over
  `duration.press`, from the pointer only. Controls of 20px or less (a checkbox box, a radio, a
  switch thumb) use `scale-press-sm` (0.9). Space and Enter act at once, with no scale: a key
  press has no finger to answer.
- **Joined controls never scale** (a button group, a joined toggle group), neither one button nor
  the whole group: a button scaled alone pulls away from its neighbour and opens a gap at the
  join, and a whole group squashing reads as one big button. The box stays still and the pressed
  button's label and icon dip inside it. Each join is one hairline.
- **Rows, options and fields darken instead**: `active:bg-hover-2` over `duration.fast`. A select's
  trigger is a field in every look, ghost included: it is as wide as its row, and a scale would
  take a share of that width.
- **A press is never the colour of the same element's hover, nor of the glide**, or it cannot be
  seen.
- **No hover rule may out-rank the press.** Tailwind's `hover:` sorts before `active:`; a hover
  written as an arbitrary selector goes inside `:where()`.
- **Pressing an option never flashes a background.** In a control with a moving thumb or
  indicator, the press is scale and text colour; the only background that changes is the thumb's.
- **Text links never scale**: the colour shifts.

### Focus

- **One ring everywhere**: 2px `accent`, 2px out, keyboard only, from the system's stylesheet. It
  follows the element's radius. Never remove it without a replacement, never fade it, and never
  change the element's shape on focus.
- **Fields draw their own ring** (`lib/control.ts`): 1px `accent` with a 4px `accent-tint` halo, on
  the `surface` fill.
- **Focus on a text field never recolours a divider or a single edge.** A standalone field shows
  its ring; a field inside a composite surface (search, prompt bar) shows the caret and nothing
  else.
- **A field shows one ring, its own.** A part selected inside it (the tag the arrow keys are on in
  a tags input) is a fill (the accent fill), never a second ring, and the caret hides while it is selected. A part
  edited in place keeps its box and its place: nothing around it moves when the edit starts.
- **A popup trigger the engine refocused after a pointer closed its popup shows no ring**: the
  browser counts that focus as keyboard focus. This holds while the last key-or-press input was a
  press (`html[data-fndn-focus-input="pointer"]`, set by `trackModality()` in `lib/modality.ts`). Any
  key shows the ring again, and a page without the tracker keeps every ring.

### Pointer and touch

- **Controls behave like native ones on touch.** The system's stylesheet gives every button and
  role-carrying control of the system `touch-action: manipulation` (no double-tap zoom delay) and
  `user-select: none` (a long press does not select the label). Content text stays selectable:
  never put `select-none` on text people may copy.
- **Text inputs are at least 16px on coarse pointers**, or iOS zooms the page on focus. Fields on
  `control` get it from there; any other field says it in its recipe
  (`pointer-coarse:text-[16px]`). Never disable zoom.
- **A link is marked by more than colour.** An inline link is underlined at rest; a standalone link
  underlines on hover. Use the Link component, or its recipe's classes on a router's link, never a
  bare `<a>` with classes of its own.
- **A target smaller than 24×24px gets a larger hit area without changing its look**: an `::after`
  that reaches past it (`relative after:absolute after:content-[''] after:-inset-1` takes a 16px
  box to 24px).
- **A drag released while it is still moving goes on in its direction**, however short it was: a
  carousel turns the page on a flick; only a drag that has stopped before the release settles on
  the nearest stop. Distance alone is never the test, because a quick flick never gets halfway.
- **A gesture does the same in every variant of a component**, unless a prop says otherwise: a
  variant changes the look, not what the hand can do. One drag turns one carousel page in every
  effect (`dragReach="page"`, the default; `free` goes as far as it is dragged), and what the
  controls can do a drag can do (with `loop="rewind"`, a drag past an end goes round, as the pager
  does).
- **A drag follows the pointer only where something travels.** Where nothing moves across the
  screen (a carousel's cross-fade), a sideways drag turns one page with the timed change instead
  of scrubbing it: following the pointer would hold two states half drawn over each other for as
  long as the drag lasts.
- **A drag handler never takes the focus a press gives.** Refusing a press's default (to stop it
  selecting text) also refuses its focus, and the keys then act on nothing: the browser scrolls
  what was last clicked by itself, behind the component's back. Refuse `selectstart` and
  `dragstart` while the pointer is held, and leave the press alone.
- **The controls say where the content is, however it got there.** Something else can always move
  a scroller (the browser, to a control that takes the focus or to a match of find-in-page): once
  it rests, what names the position (a carousel's pager and dots) follows it.
- **Scroll chaining.** A scroller that floats over the page or is a fixed pane (popup, dialog,
  drawer, sidebar) is `overscroll-contain`: the page behind never moves. A scroller in the page's
  flow (code block, table, list, chat thread, scroll area) hands the wheel on to the page at its
  end and never stops a wheel it cannot use; it keeps only sideways overscroll in
  (`overscroll-x-contain`), so scrolling a table sideways never triggers the browser's back
  gesture.
- **Cursor**: `pointer` on anything clickable (the stylesheet sets it), `cursor-default` when
  disabled.

### Layout that survives real data

- **Direction** comes from logical utilities: see `docs design` (Type).
- **A flex or grid child that holds text gets `min-w-0`**; fixed-size boxes (icons, avatars,
  badges, trailing actions) get `shrink-0`.
- **Decide for each text whether it wraps, cuts at the end, cuts in the middle or clamps.** Cut text
  carries its full value in a `title` (`truncationTitles` and `middleTruncation` in
  `lib/truncate.ts`; the middle cut is for paths and IDs). What is never cut is in `docs design`
  (Wrap or cut the product's way).
- **Badges and pills never wrap**: `whitespace-nowrap shrink-0`.
- **Reserve space for anything that arrives late** (icons, counters, streamed text) so the layout
  never shifts. Icons already reserve a 1em box (`data-slot="icon"`).
- **Show a component on a solid `surface` or `canvas`**, never over a dotted or textured ground or
  an image: parts without a fill of their own then read as broken.
- **Rows of chrome above content are few.** A header is one row where it can be; where two remain,
  they follow `docs design` (Shared edges).

### Alignment

- **Icons are centred in their box with flex or grid**, never with line-height or vertical-align
  tricks.
- **A control's height comes from its content plus padding, or from an explicit height on the
  control itself.** A child never has to be taller than its parent's content box.
- **Text and icons in one row share `items-center`.** The icon's size is set on the icon (its font
  size, or `size-*` on `data-slot="icon"`), never inherited by accident.
- **A hairline that must look the same on every row is a border, not a 1px background.** At a
  fractional display scale (125%, 150%) a 1px background lands one device pixel wide in some
  places and two in others; a border is drawn on whole device pixels.
- **A row that opens never moves its own title.** Give its first line a fixed height, not a
  minimum: a minimum stretches a lone line and lets go once a second line appears.
- **A control whose label can wrap (checkbox, radio, switch) stays on the first line**: the row is
  `items-start`, and the label's line is sized so the control and the first line share one centre.
- **A fixed-size control never stretches.** A width given to a labelled control sizes the whole row;
  the control keeps its size (a switch stretched to a long label no longer reads as a switch).
- **A tree's guides are never broken by a row.** A row's fill, its focus ring and the hover
  highlight start where the row's level starts, so none of them crosses a guide; the whole row is
  still the hit area. Guides are `line-strong` at rest and `ink-3` on the level that holds the
  selection, so the selection's folder shows at a glance, and they end a little short of their
  last child.
- **When an adapter renders a wrapper around its control** (a switch inside its label), `class` and
  `style` land on the outermost element, which is what a caller sizes and places; every other
  attribute stays on the control.

### Choosing among options

**The same kind of thing is built, looks and moves the same way everywhere.** Lists of options
(select, menu, search results, suggestion lists), single-choice controls (segmented control, tabs,
filter chips, radio group) and choice marks (check, radio dot) each follow one recipe. A component
never invents its own version, and never redraws by hand a part that is another component (see
`docs authoring`, Compose, never copy).

The shared pieces are in `lib/`: `popup` (the surface), `option` (the row), `glideLayer` and
`glide()` in `lib/glide.ts` (the highlight), `control` (the field). A component composes them into
its own recipe and never copies them.

| Kind | Rule |
| --- | --- |
| Popup list (select, menu, combobox, suggestions) | Its content composes `popup`: `surface`, `shadow-raised`, `rounded-card`, 4px padding, its own scroll up to 360px or the space available. Motion: `docs motion` (Recipes). |
| Option row | `option`: 30px; `sm` 26px; `lg` 36px, only for rows with two runs of text. `text-dense` (12.5px) text, 5px × 8px padding, 8px gap, `rounded-chip`, no gap between rows. A 14px `ink-3` icon. On coarse pointers 40px and 14px text. |
| Option label | Shown whole: past the list's width the label (and a group label) wraps and the row grows, the glide with it. It keeps its own direction (`[unicode-bidi:plaintext]`). |
| Description | The one part that is cut: it gives way to the label (which keeps up to 70%) and carries a `title` while cut. |
| Group label, separator | Group label `2xs`, weight 500, `ink-2`, padding 6px 8px 4px. Separator a 1px `line` that bleeds 4px into the popup's padding. |
| Navigation rows (sidebar, tree) | A different kind: see `docs design` (Shape and spacing). |
| Highlight in a list | Every list of options, however short, has one glide layer, `bg-hover`, and never falls back to a per-row background. A list built by hand (a sidebar, a tree) has one too. It travels at `duration.move` with `ease-out-strong` for pointer and keyboard moves alike, because it is what shows where the highlight went. Its first appearance lands on the row and fades in over `duration.base`; one already there when the list mounts shows at once. Rows, group labels, headings and separators sit above it (`relative z-1`) with no background of their own, so it keeps gliding across them and passes behind. A row never paints its own hover or highlight. |
| Current or open item | `bg-hover-2`. |
| A single target outside a list | Hovers with `hover:bg-hover` and `motion-colors-fast`. |
| Inline single choice (segmented control, tabs, chips) | One indicator travels (transform, and width) over `duration.move` with `ease-move`, switched on only while a selection is made: no slide on mount, instant from the keyboard. The travel stays, though the control is used often: for a pointer selection it shows where the selection went. Unselected items never paint the indicator's look. Hover is a colour, `ink-2` to `ink`, over `duration.base`; pill tabs too, whose selected pill is `bg-field` with `rounded-chip`. |
| Disclosure caret | Points to the reading direction and turns down (90°) over `duration.move` with `ease-out-strong`, instant from the keyboard. |
| Popup trigger caret | Points down and flips 180° over `duration.move`, instant from the keyboard. |
| Shared atoms | Shimmer text, spinners, visually hidden text (Tailwind's `sr-only`) and the reveal exist once. A component uses them and never copies them. |
| Stacking | From the `z` tokens on the engine's positioner (`z-popup` < `z-dialog` < `z-toast` < `z-tooltip`), never from a component's own `z-index`. |

**The names of choices are shown whole.** A select's list is at least as wide as its trigger, then
as wide as its longest option up to 360px, and a longer option wraps. The trigger shows one line
and may cut the selected label. A row of named choices that does not fit (segmented control, tabs)
becomes a pager plus a select rather than cutting its labels.

### Fields

Every field-like control (input, textarea, select trigger, combobox, date picker, number, pin,
tags, input group, password, editable, clipboard field) is one surface, `control`
(`lib/control.ts`). `size`, `variant` and `shape` mean the same on every component, and the
sizes and looks are in `docs design` (Controls) and `docs authoring`
(Sizes and looks); in short, `xs` 24 · `sm` 28 · `md` 32 · `lg` 36, with 12 · 13 · 14 · 14 text
and 6 · 8 · 10 · 12 padding, `rounded-chip` up to 28px and `rounded-control` from 32px. A field
has those corners in every app; buttons, toggles and segmented controls take them in a rounded
app (`docs design`, Controls).

**Every state is the same in every look.** Hover takes the `hover` fill. Focus and open take the
`surface` fill and the accent ring: a text field for any focus, a trigger for keyboard focus and
while open. One exception: an open ghost trigger stays the label it reads as, with the `hover-2`
fill an open ghost button keeps and no ring, so a row of ghost controls never has one that has
turned into a field. Invalid shows a red hairline, then the red ring when focused. Read-only has no hover
fill and still shows the ring. Disabled is half opacity.

**Nothing the user types is dropped without a sign.** A value a field cannot take twice (a tag
typed again, or a tag edited into another's text) selects the one already there instead of
vanishing. An edit in place is kept however it is left (Enter, Tab, a click away); only Escape
cancels it.

**Components with a scale of their own** (Avatar, Spinner, Checkbox, Switch, Slider, Rating, Tag,
StatusPill, Count, Progress, Dialog) are not controls of the shared height scale.
