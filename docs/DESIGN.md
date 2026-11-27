# Design

The static choices of a screen built with this system: which component, size, look, token and
layout to use, and why, so that it looks as if its authors had made it. Each rule is here once;
the rest has its own page:

| For | Read |
| --- | --- |
| Every token and its values | `docs tokens` |
| One component: its props, parts and examples | `docs <name>` |
| What moves, how fast, and what never moves | `docs motion` |
| How a control responds to pointer, touch and keyboard, and holds up with real data | `docs interaction` |
| Keyboard patterns, names and roles, contrast ratios | `docs accessibility` |
| Building a component the system lacks | `docs authoring` |

(Those are commands of the tool; the docs site has the same pages.) Every token is a Tailwind
utility: `bg-surface`, `text-ink-2`, `rounded-card`, `shadow-card`.

## The character

A crisp tool: fast, quiet, exact. A calm, cool-grey workspace for dense, desktop-first product UI
(editors, inspectors, agent traces, tables, approvals) that still works on a phone. Chrome stays
out of the way; the content and the agent's work carry the colour. Unsure whether something should
be filled, coloured or animated? It should not.

## Start from the product

**Name the product the screen is like** (VS Code, Chrome, Linear, a billing dashboard) and compare
yours with it at the same width. Take its density, its conventions and its way of showing state.
Components can each be right and the screen still wrong, so judge the whole.

| Product | Controls | Rows | Text |
| --- | --- | --- | --- |
| Editor, browser | `sm`; `xs` in a status bar and inside fields and rows | 24 to 28px | 12 to 13px |
| Tracker, dashboard | `sm` | one line, 35px | 13px |
| Form, settings, docs | `md` fields | as tall as their content | 14px |

| Row of chrome | Height |
| --- | --- |
| A title bar | 36px |
| A pane's header | 32px, the height of a tab strip beside it |
| A status bar | 24px |
| An app's top bar | 44 to 48px |

**The three heaviest marks on the screen** (a fill, a size, a colour, something moving) are the
main action or the content. What takes their place by mistake: a filled button for an action that
is always there, a tinted pill in a status bar, a pressed toggle drawn as a grey box, a spinner
that runs before the user did anything. Make those quieter.

**Content is the largest text in its region and chrome the quietest.** A sidebar is no larger than
the rows it lists (`sidebar-nav size="sm"` beside 13px content), an explorer no larger than the
code (TreeView `size="xs"`).

## Surfaces and depth

| Token | What it is for |
| --- | --- |
| `page` | The app's background, behind everything. |
| `canvas` | Recessed: behind cards, and the chrome a joined surface sits on (title bar, activity bar, explorer, tab strip, status bar). |
| `surface` | Where the work is: cards, panels, popups, dialogs, the selected attached tab and the panel it joins. |
| `inset` | A well inside a surface: a card's footer, a `subtle` field, a boxed count. |
| `field` | The fill of an `outline` field. |
| `hover` | The hover of a row or a ghost button; the highlight that travels in a list. |
| `hover-2` | Stronger: a pressed row, the current nav item, an open ghost button, the secondary button's fill. |

Depth is a 1px ring plus a shadow, from five tokens and never a home-made shadow:

| Token | For |
| --- | --- |
| `shadow-hairline` | The ring alone: a flat box, an outline field. |
| `shadow-btn` | Outline buttons, keyboard keys. |
| `shadow-card` | Cards, tables, a neutral alert. |
| `shadow-raised` | What opens from a trigger: menus, selects, popovers, hover cards. |
| `shadow-overlay` | What floats over the page: dialogs, drawers, toasts, a floating action bar. |

- **One surface, never a box in a box.** A list or a table inside a pane is part of the pane
  (Table and Listbox have `variant="flush"`), not a card in it. A card inside a pane is right only
  for an object of its own in the content: a comment, an approval waiting for a decision.
- **Things in one plane are divided by hairlines, not shadows**: `line` between panes and rows of
  chrome, `line-soft` between the rows of a list or a settings group. They are solid colours, so
  they read the same over any fill. (`line-strong` is the edge of an outline button.)
- **A popup stands close to its trigger.** A list you pick from (menu, select, combobox) opens 4px
  from its trigger, because it continues the field; a popover, hover card or tooltip 6px, because
  it is a surface of its own beside it. A context menu opens at the pointer.
- **Stacking comes from the `z` tokens** (`z-popup` < `z-dialog` < `z-toast` < `z-tooltip`), set on
  the engine's positioner, never from a `z-index` of a component's own: one order for the whole
  app means a toast is never under a dialog.
- A modal window sits on `scrim`. A tooltip is the one inverted surface.

**Dark is composed, not inverted.** It is turned on with `data-theme="dark"` (or `class="dark"`)
on `<html>`; whether to follow `prefers-color-scheme` is the app's choice. Lighter means nearer:
`page` < `canvas` < `inset` < `surface` < `hover` < `hover-2`, and the ring becomes a faint white
edge. A step between two surfaces must read as clearly in dark as in light: compare their contrast
ratios, not their lightness numbers (the selected attached tab must stand off its strip in both).
If it does not, the token is fixed, never one component with `dark:` overrides.

## Ink and colour

- `ink`: primary text, values, titles, the label of the current or selected item.
- `ink-2`: secondary text: descriptions, helper text and hints under a field, the description of
  an option, a setting, a card or a dialog, an empty state's message, a caption that explains a
  value, a status line, table header labels, the rows of a nav that are not current, the value of
  a ghost select, and meta labels (IDs, timestamps, counts, units, group labels, a pane's label such as Explorer, a
  property's label beside its value, a tab, a segment or a breadcrumb that is not current).
- `ink-3`: tertiary, never text that says something: placeholders, icons at rest, separators and
  other decoration, and what is disabled.
- `on-ink`, `on-accent`: text on an ink fill or a coloured fill.

**Text read for meaning is at least `ink-2`.** `ink-2` reaches 4.5:1 on every surface in both
themes; `ink-3` is only about 2.2:1 to 3.5:1 (`docs accessibility`, Contrast), so a sentence that
says what a control does, what will happen or why something is empty is `ink-2`, however quiet it
should look. A label is made quieter than what it sits beside by size and weight, not by a fainter
grey (a 12px `ink-2` helper under a 13px/500 `ink` label). A count stays `ink-2` whether or not its
tab or segment is selected; output with two levels (a terminal) uses `ink` and `ink-2`.

What stays `ink-3` among text, because nobody reads it for meaning:

- line and row numbers, which only repeat a position;
- the ink a shimmer sweeps across (the moving band carries the reading);
- the "—" of an empty value (a placeholder);
- a row that is unticked in a diff (a state, like disabled).

**Hierarchy comes from ink before it comes from boxes or weight.** The current row is `ink` among
`ink-2` rows; an icon button is `ink-3` until hovered; a property's label is `ink-2` beside its
`ink` value. A selected row is a tint (`accent-tint` for a picked set, `hover` for the open item,
`hover-2` for the current nav item), not a border.

**One accent.** `accent` marks keyboard focus, selection (`accent-tint`), what is new or under way
(a running status, a progress bar, an unread dot, an information alert) and at most one action in
a view that must stand out. Never decoration, never a second blue.

**Green, orange and red say done, attention, and failed or destructive.** Full colour for text,
icons and dots; their tints (`green-tint`, `orange-tint`, `red-tint`) behind pills, alerts and an
invalid field.

**A status is a `status-pill`, shown the way its place asks:**

| Where | How |
| --- | --- |
| A table column, a list row | StatusPill `size="sm"` |
| A header, a card, a property row | StatusPill |
| A status bar, an editor's list (changed files, problems) | A glyph or a letter in the status colour beside ink text, no pill |

**A label people assign is a `tag`** (a category, an environment, a project), in one of its eight
hues. A hue on a tag says nothing about state. Many hues in one row: Tag `variant="outline"`,
which keeps the hue in its dot.

**State is never colour alone**: a status dot comes with its word, a priority glyph has a name, an
invalid field shows its error text, a selected row has its ARIA state and its ink. Forced-colours
mode drops the colour and keeps the rest. Colours that are data (an avatar, a favicon) are fine.

## Type

Inter with slightly tight tracking and tabular figures by default; JetBrains Mono for code, IDs,
values, timers and keys.

| Size | Use it for |
| --- | --- |
| `2xs` 11px | Group labels, a row's meta or shortcut, keyboard keys. |
| `xs` 12px | Chrome: a pane's label (Explorer, Changes), status bars, helper text, tooltips, an editor's tree, a terminal. |
| `dense` 12.5px | The options of a popup or a menu, table header cells, lines of code. |
| `sm` 13px | Dense content: table values, list rows, card titles, a dialog's body. |
| `md` 14px | Body text, nav rows, a dialog's title. |
| `lg` 16px | The title of a detail pane. |
| `xl` 20px | A page's one title (Settings, History). |

Controls set their own text: 12px at `xs`, 13px at `sm`, 14px at `md` and `lg`. A size the scale
names is written as its token: 12.5px is `text-dense`, never `text-[12.5px]`, so a change of
scale reaches every use.

- **Weights**: 400 for running text; 500 for labels, buttons, card titles, table values and the
  checked option; 600 for the title of a window, a page or a section. 500 is the system's
  emphasis, so 600 stays rare and 700 is not a text weight.
- **Numbers** are tabular wherever they change or line up, and sit at the end of a numeric column.
  They are never cut (Wrap or cut the product's way).
- **Direction.** Right-to-left takes two settings, one for each half of the work: `dir="rtl"` on
  `<html>` mirrors the layout, and Ark UI's `LocaleProvider`, placed once at the app's root with the
  app's locale (`<LocaleProvider locale="ar-EG">`, from `@ark-ui/react/locale`, `@ark-ui/vue/locale`
  or `@ark-ui/svelte/locale`), gives the components their direction for the keyboard; without it
  the arrow keys stay left to right. Components take no `dir` prop. Layout uses logical utilities
  (`ps-`, `me-`, `start-`, `text-start`), never `ml-`, `pr-`, `left-` or `text-left`, so it
  mirrors with `dir`; arrows and carets mirror too. Text people wrote keeps its own direction
  (`[unicode-bidi:plaintext]`); code, URLs, emails and paths stay left to right (`dir="ltr"`).

## Shape and spacing

Radii step `chip` 6 · `control` 8 · `card` 10 · `window` 14, and `pill`. Controls follow one rule,
fields and rounded buttons alike, so a small button and a small select in one row have the same
corners:

| Radius | On |
| --- | --- |
| `chip` | Controls of 28px and under (`xs`, `sm`): fields, and buttons, toggles and segmented controls in a rounded app. Option rows, tooltips, small tags. Nav and tree rows of 28px and under (`sidebar-nav size="sm"`, a tree at `xs` or `sm`). |
| `control` | Controls of 32px and over (`md`, `lg`). Nav and tree rows of 32px and over. |
| `card` | Cards, tables, popups, toasts. |
| `window` | Dialogs, drawers, overlay cards. |
| `pill` | Buttons, toggles and segmented controls unless the app is rounded; status pills, a floating action bar. |

**Corners are concentric**: an inner radius is the outer one minus the gap. A popup (`card`, 10)
with 4px of padding holds rows of `chip` (6).

**Spacing is on a 4px grid** (`space.1` 4 to `space.6` 24), with 2px only for tight inner gaps.
Heights come from the control scale, not from padding guesses. The components space themselves;
what you build beside them matches their measures:

| What | Measure |
| --- | --- |
| A table's row | 35px, 12px inline in a cell |
| A nav or tree row | 32px (28 at `sm`; a tree also 24 at `xs`) |
| A menu's row | 30px, 8px inline, inside 4px of popup padding |
| A card | 12px of padding; its header 10 × 12; its footer on `inset` |
| A dialog | 16px all round |

## Controls

**One height scale for everything a user presses or types into**: `xs` 24 · `sm` 28 · `md` 32
(the default) · `lg` 36, so an `sm` Button, Select, Toggle and segmented control line up in one
row.

- `sm` is the working size of an app: toolbars, filters, card headers, row actions, the buttons of
  a dialog's footer.
- `xs` is for a status bar, a bookmarks bar, and a button inside a field or a row.
- `md` is for the fields of a form, and for the button of a form that stands alone (a sign-in).

One size in one row of controls. `size` changes dimensions only; a look is a `variant`.

**Buttons.**

| Variant | Look | For |
| --- | --- | --- |
| `primary` | ink fill | The main action of a view. |
| `outline` (default) | surface, hairline edge | Any other action. |
| `secondary` | quiet grey fill | A quiet alternative beside a filled button (Discard). |
| `ghost` | no fill until hovered | Toolbars, rows, headers, icon buttons. |
| `accent`, `success` | blue fill, green fill | The one action that must carry that colour (Commit). |
| `danger` | red fill | The button that destroys: the confirm of an alert dialog. |
| `danger-outline` | red text and edge | The button that starts a destruction, in a danger zone. |

- **At most one button in a view carries the ink fill or a colour fill** (`primary`, `accent`,
  `success`, `danger`), **and often none.** It is the view's main action. `secondary` is a quiet
  grey that may sit beside it and does not count. A button that only opens the dialog where the
  decision is made can stay `outline` (a tracker's "New issue"); the fill then goes to the
  dialog's confirm ("Create issue").
- **Shape is chosen once for an app, in `fndn.json`.** Buttons, toggles and segmented controls are
  pills. An app whose chrome is square-cornered (an editor, a tracker) sets `"shape": "rounded"`
  there (`init --shape rounded`, or edit it and run `update`), and every one of them takes a
  field's corners, in dialogs, menus and cards too. No control then repeats it, so one setting
  cannot disagree with itself: the `shape` prop is for the one control that must differ from its
  app (a pill filter in a rounded app), and `data-shape="rounded"` on an element turns one part of
  a page. Never both shapes in one row.
- **A button is as wide as its label.** Full width only in a narrow form that stands alone (sign
  in, create a workspace), never in app chrome.
- **Icon-only**: `square`, with its name in an `aria-label` (`docs accessibility`, Names, roles,
  announcements). Add a Tooltip that shows the name unless the icon cannot be misread where it
  stands (a clear button in a field, the arrows of a pager). In headers, fields and rows it is
  `ghost` with `muted` (`ink-3`, `ink` on hover; a muted button that has a label rests in `ink-2`).
  The button sizes its icon.
- **A button is the size of what it shows now**: a Copy/Copied button cross-fades (`swapped`) and
  goes at the end of a row, where growing moves nothing; a `busy` button keeps its width under its
  spinner.

**Toggles.** A toggle is the Button that stays pressed, in the Button's `ghost` or `outline` look;
pressed keeps the `hover-2` fill. App chrome takes `ghost` toggles, `muted` when icon-only: the
open view of an activity bar, a panel switch, a bookmark star (its filled glyph when pressed).
`outline` toggles are for options and filters that stand among outline controls.

**Fields.**

| Variant | Look | For |
| --- | --- | --- |
| `outline` (default) | field fill, hairline edge | Forms; the filters of a bar above a table, where a select takes a fixed width. |
| `subtle` | inset grey, no edge | Side panels and inspectors; an address or search bar in chrome. |
| `ghost` | reads as text until touched; open, it keeps a darker fill, not a field's ring | Property rows of a detail pane; a filter in a dense toolbar, as wide as its value. |

**Joined controls and single choices.** Related actions or a split button: ButtonGroup (inner
corners square, one hairline at each join), never buttons joined by hand. One or several pressed:
ToggleGroup. One choice among a few: SegmentedControl. Switching views that each have a panel:
Tabs.

## Laying out a screen

**Shared edges.** Rows of chrome above content share one inset: a toolbar's padding equals the
first column's, so filters and rows start on one line. A sidebar has one text edge (a link without
an icon is indented to the label column). Two header rows sit flush, each centred between its
hairlines, with the same inset at both ends. Say a thing once: a project name in the title bar and
again as the explorer's title is noise.

**Toolbars.** One row that wraps (`flex-wrap`), the main action at the end (`ms-auto`). Named
controls stand 8px apart; the icon buttons of a group 2px, so the group reads as one tool. A bar
that depends on a selection (bulk actions) opens its own row rather than covering the toolbar.

**A title beside its actions** (a screen's header, a card's header) keeps at least 10rem: the
actions drop to a line of their own before they squeeze it.

**Lists and tables.** One line per row in a pane; one column (the title) gives way. A selection
checkbox shows on hover or once any row is selected, so a column of empty boxes does not sit
beside every row before selecting starts. Table rows hover at once; lists of options have the
travelling highlight (`docs interaction`, Choosing among options). Too wide: scroll sideways, do
not squash. A single item needs no pager.

**A screen's header** is the PageHeader: the title (a real heading), a description under it, a
back link above it that names where it goes, and the actions at the end of the title's line. Do
not build it by hand. In a pane above a list it is `size="pane"`: one row, the title at 13px.

**A detail pane** is a label column in `ink-2` beside ghost controls. Its description is plain
text that becomes a field only while it is edited. On a desktop the detail of a list item opens in
a split pane beside the list, not in a dialog; narrow, it replaces the list.

**Wrap or cut the product's way.** Code and list rows stay on one line and scroll or truncate.
The name of a choice (an option, a segment, a tab that selects a view) and a number are never
cut: they wrap, or a row of choices that does not fit becomes a `pager` plus a `select`, because
a cut name cannot be told from its neighbour and a cut number is a wrong number. Only free text
that is not a choice may be cut, and then carries its full text in a `title`: a title, the text
of a list row, and a document tab (a browser or editor tab, whose title is free text). A field
may cut the label it has chosen, since its list shows every name whole.

**Pick a component by its look, not its name**, and read its variants in its docs before building
around it:

| For | Use |
| --- | --- |
| Records in a pane | Table `variant="flush"`: no card, rules between rows only |
| Data on a page or a canvas | Table (its `card` look) |
| A change list | Listbox `variant="flush"` |
| An explorer | TreeView `size="xs"` |
| Document tabs | Tabs `variant="attached"` (`tabSizing="fit"` for files; `shrink` for browser tabs) |
| The tabs of a panel | Tabs `variant="underline"` |

## Every state of a view

**Empty.** EmptyState `size="block"` (icon, title, hint) for an empty table, list or pane;
`size="row"` (one quiet line) inside a short list or a popup, where a block would be too tall.
When there is a next step, give it as the real Button (`action`): "Clear filters" when filters hid
everything, "New issue" when there is nothing yet.

**Loading.** A table shows still skeleton rows (`loading`), never a shimmer across a surface that
is looked at all day. Long agent work uses LoadingState with its elapsed time. A page load shows a
thin Progress at the top edge and keeps the previous page until the next is ready.

**Errors.** A field: Field `invalid`, with its error in place of the helper. A problem with a
section: an Alert `tone="red"` in the page. Something that just happened and can be retried or
undone: a toast with the action. A destructive decision: AlertDialog, its action named by its verb
("Delete project").

**The first frame is complete and still.** Nothing moves, scrolls or spins on load, and every pane
shows its start (a chat opens at the top, a terminal at the first line of its last run).

## Overlays

| Component | When |
| --- | --- |
| Tooltip | Names a control. Holds nothing interactive. |
| HoverCard | A preview, on hover or focus. |
| Popover | A small interactive surface beside its trigger (site information, a downloads list). |
| Dialog | A task that takes the user's attention and blocks the page (create an issue). Its buttons go in the footer (`actions`), least destructive first, never in the body. |
| AlertDialog | The confirmation of a decision that cannot be undone. |
| Drawer | A panel from the side, or a sheet from the bottom on a phone. |
| CommandPalette | Every page and action in one searchable list: a bare Dialog around the Search panel, near the top, that opens at once. |

## Phone

**At 390px the screen takes the phone's patterns**, not a squeezed desktop: one view at a time,
picked at the bottom; list rows of two lines instead of a table; a tab-count button and a sheet
instead of a tab strip; checkboxes behind a "Select" button. On touch screens fields are 40px tall
with 16px text (`docs interaction`, Pointer and touch).

## Motion and behaviour

The components carry their motion and their keyboard behaviour, and `docs motion` and
`docs interaction` hold the rules. What is left to a screen:

- Set `appear` only on the item your code adds while the user watches (`docs motion`, Mount and
  arrival).
- Add no transition around a component: one would hold back what the keyboard changes at once
  (`docs motion`, Choreography), and every timing comes from the tokens (`docs motion`, Timing).
- Give what you build yourself the same hover, press and focus (`docs interaction`, States) and
  build its behaviour on Ark UI (`docs authoring`, Behaviour).
