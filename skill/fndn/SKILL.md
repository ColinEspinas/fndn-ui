---
name: fndn
description: Build UI with the fndn/ui component system (React, Vue 3, Svelte 5; Tailwind 4 recipes written with tailwind-variants; Ark UI for behaviour; Phosphor icons). Use it whenever you add or change a page, form, dialog, toolbar, table, menu, settings screen, command palette, chat or agent surface, or any component, in a project that has this system (a fndn.json at its root, a components/ui folder with one folder per component and a *.recipe.ts in each, data-slot attributes in the markup), even when the request only says "use our components"; when you customise one of its components; and when you build a component it does not have.
---

# fndn/ui

A component system whose components are copied into the project as source files the project owns.
Each one is a folder in the project's ui folder (`button/`): a recipe (`button.recipe.ts`, every
Tailwind class of every part), an adapter for the project's framework, and an `index.ts` that app
code imports from; `lib/` beside them holds what components share. The React, Vue and Svelte
adapters render the same DOM. Behaviour (keyboard, focus, ARIA) comes from Ark UI. One tool, `fndn`,
finds, documents, adds and checks them.

```ts
import { Button } from "@/components/ui/button";   // the same line in React, Vue and Svelte
```

That path is the project's own: `@/components/ui` when it has that alias, a relative path when it
has none. `add` prints the line to use, and `docs` writes every example with it.

An interface built with it should look and behave as if the system's authors had built it. Most
of what goes wrong comes from writing markup and classes by hand where a component, a prop or a
token already says what to do.

## The tool

Run it as `npx fndn <command>`. When the `fndn` MCP server is connected, its tools (`search`,
`docs`, `add`, `check`, `status`, `init`) are the same commands: use either.

| Command | What it gives |
| --- | --- |
| `status` | Whether the project is set up, its framework, the components it has, the files it changed |
| `init` | Sets a project up, once (it needs Tailwind 4): `fndn.json`, the stylesheet, the fonts, this skill |
| `search <need>` | The components that answer a need ("pick a date"); every component without a query |
| `docs <name>` | A component's contract (parts, props, events, keyboard, motion) and its first two examples as complete files in the project's framework; the others are listed by id: `docs <name> --example <id>` prints one |
| `docs <topic>` | `design` · `motion` · `interaction` · `accessibility` · `authoring` · `porting` · `rules` · `tokens` · `icons` · `install` |
| `add <name…>` | Writes the components, and everything they import, into the project's ui folder |
| `check` | Reports what breaks the system's rules, each with its reason and what to use instead |
| `update` | Brings the added components up to date; a file the project changed is left alone |
| `remove <name…>` | Deletes components and what only they needed; it keeps whatever the project's code still imports. Never delete a component's folder by hand: `update` would write it again |

## How to build with it

1. **Look.** `status`. Not set up: `init`, then do what its output asks (install, a stylesheet import).
2. **Pick** a component for every piece of the request: `search`, and the table below. Prefer a
   component to markup, and a prop to a class.
3. **Read** `docs <name>` for each component before you use it: the props and the examples are
   where the right composition is. Read the list of further examples at the end of the page: the
   one that matches your case (an icon-only button, a form in a dialog, an undo) is often there.
   Laying out a whole screen: `docs design` first.
4. **Add** them with `add`, and install the packages it names. A folder that holds only a recipe
   (`checkbox/checkbox.recipe.ts`) is the look another component borrows, not half a component:
   `add checkbox` brings the rest when you need it.
5. **Compose**, following the rules below.
6. **Check.** Run `check` and fix every error; weigh each piece of advice. Run the project's own
   typecheck. If you can open the result, look at it in light, in dark and at a narrow width.
7. **Report** what you could not verify, and what the system lacked.

### Which component for what

| Need | Use |
| --- | --- |
| A form or settings: a labelled control with help text or an error | `field` around `input`, `textarea`, `select`, `number-input`, `password-input`, `pin-input`, `tags-input` |
| One of a few options, all visible, in a form (a frequency, a plan) | `radio-group` |
| One of a few views or modes (Edit / Preview), in a toolbar or header | `segmented-control`; `tabs` when each option has its own panel |
| One of many options | `select`; type to filter: `combobox`; a list laid in the page: `listbox` |
| On/off that takes effect at once | `switch`; a choice saved later with a form: `checkbox` |
| Formatting toggles (bold, italic) | `toggle-group` (multiple) or `toggle` |
| A toolbar: a split button, joined actions, a segment | `button-group` (with `menu` for the caret) |
| Actions behind a button / on right click | `menu` / `context-menu` |
| Command palette | `command-palette`; a search field with its results in the page: `search` |
| Confirm a destructive action | `alert-dialog` |
| A panel from the edge, a hint, a preview | `drawer`; a short hint: `tooltip`; content on click: `popover`; a preview on hover: `hover-card` |
| The state of something (run state, health) | `status-pill`; a label attached to something (category, environment): `tag`; a code value in text: `chip` |
| Keyboard shortcut / a number badge | `kbd` / `count` |
| A message that leaves by itself / that stays in the page | `toast` / `alert` |
| Nothing to show (empty) / still loading | `empty-state` / `loading-state`, `spinner`, `shimmer`, `progress` |
| Rows of data: a table, a list of records | `table` (static), `records-table`, `filter-table` |
| Show and hide a region | `collapsible`; several: `accordion` |
| Navigation | `sidebar-nav`, `navigation-menu`, `breadcrumb`, `tabs`, `pager`, `steps` |
| A long row of named choices that may not fit | `pager` + `select`, never cut labels |
| Agent and chat surfaces: a composer, a conversation, an agent's work | `prompt-bar`, `chat-composer`, `message`, `streaming-text`, `thinking-state`, `tool-chips`, `task-rows`, `approval-card`, `agent-screen` |

What the user names wins over this table (asked for a switch in a form that saves later: use the
switch, and say that a checkbox is the convention there).

### When nothing fits

1. Use the nearest component as it is, with `class` for placement and size, before anything else.
   (A dialog, an alert dialog, a popover, a drawer or a hover card takes no room of its own: its
   root is a layout-neutral wrapper, so place the trigger you give it, not the component.)
2. A lasting change of look is a variant in the project's copy of the recipe (the files are the
   project's), not classes repeated at every use.
3. A new component is built the way the system builds its own. Read `docs authoring`, then the
   recipe and the adapter of the closest component in the project's ui folder. Give yours a folder
   beside it (`<name>/<name>.recipe.ts`, its adapter, an `index.ts` that exports it), compose what
   `lib/` offers (the shared recipes `control`, `popup` and `option`, the gliding highlight, the
   helpers), take behaviour from Ark UI, and mark every part `data-slot="<name>-<part>"`. `check`
   holds it to the same rules as the library.
4. Tell the user which piece the system was missing.

A project in another framework (Solid, Angular, Lit, plain DOM): the recipes, the stylesheet and
the shared code are reused unchanged and only the adapter is written anew. `docs porting` says how.

## Rules that `check` enforces

It reports each with its reason and the fix (`docs rules` lists them), so they are short here.

- **Tokens only.** Colours, radii and shadows are token utilities: `bg-surface`, `text-ink-2`,
  `border-line`, `rounded-control`, `shadow-raised`. No Tailwind palette (`gray-500`, `white`), no
  literal colour, no `rounded-lg` or `shadow-md`. The tokens carry light and dark.
- **Motion from the vocabulary.** `motion-<colors|opacity|shadow|transform|filter|size|radius>-<timing>`,
  `duration-<token>`, `ease-<token>`, `scale-press`, `scale-popup` (`scale-y-popup` for a list as
  wide as its field), `animate-fade-up|fade-in|pop-in`.
  Never Tailwind's `transition-*`, a raw duration or easing, `animate-spin`, a scale of your own.
- **Layers from the z tokens** (`z-popup`, `z-dialog`, `z-toast`, `z-tooltip`), never a large number.
- **Icon-only controls are named**: `aria-label` (on a Toggle, its `tooltip` prop also names it).
  A Tooltip wrapped around a Button shows the hint to sighted users and does not replace the name.
- **What you import is in the project**: `add` a component before you import it.
- **In hand-written CSS**: hover inside `@media (hover: hover) and (pointer: fine)`, durations and
  easings from `var(--fndn-duration-*)` and `var(--fndn-easing-*)`, never `transition: all`.

## Rules only you can keep

Each exists because breaking it is a usual mistake. The details: `docs design`, `docs motion`,
`docs interaction`, `docs accessibility`.

**Compose real components.** A part that is a button, a checkbox, a pill or a menu is that
component, never a copy drawn with the same classes: copies drift, and they miss the behaviour.
Style a part from outside through its slot (`[&_[data-slot=button-icon]]:text-ink-3`). State is in
attributes (`data-state`, `aria-checked`), styled with variants such as `data-[state=open]:`.

**Popups, menus, selects, dialogs and tooltips come from the component.** Never hand-roll a focus
trap, an active-index list or a positioned layer: the keyboard and screen-reader behaviour is the
hard part, and it is done.

**Shape is the app's, set once, in `fndn.json`.** Buttons, toggles and segmented controls are pills.
For an app with square-cornered chrome (an editor, a tracker, a dashboard) set `"shape": "rounded"`
in `fndn.json` (`init --shape rounded`, or edit it and run `update`): every one of them takes a
field's corners, in dialogs and menus too. Do not repeat `shape="rounded"` on each control; the
prop is for the one that must differ.

**Size is dimensions, look is a variant.** One height scale for everything pressed or typed into:
`xs` 24px · `sm` 28px · `md` 32px (default) · `lg` 36px; controls in one row share a size.
Buttons: `primary` for the one main action of a view, `outline` (the default), `secondary` (grey
fill) or `ghost` (no fill until hovered) for the rest, `danger` for destruction. Fields:
`outline`, `subtle`, `ghost`. Never build a look from `size`, or a size from classes.

**Nothing plays on first paint.** A page that loads does not animate in, and a component never
animates its own mount. Set `appear` only on the item your code adds while the user watches (the
reply an agent just produced), never on what you render from history or with the page. Something
that arrives later makes room as it fades; it never pushes its neighbours in one frame.

**The keyboard is instant.** Changes made from the keyboard do not animate; the components do
this by themselves. Do not add transitions around them that would.

**Joined controls are a `button-group`.** Never join buttons with negative margins or borders.

**Names are shown whole.** The names of choices (options, segments, tabs) and numbers are never
cut. A crowded row of content wraps; a toolbar wraps between its groups or scrolls sideways; a row
of choices that cannot fit becomes a `pager` + `select`.

**Scroll.** A scroller in the page's flow (a table, a code block, a toolbar row) hands the wheel on
to the page: `overscroll-x-contain` at most. Only popups, dialogs, drawers and fixed panes use
`overscroll-contain`.

**One surface, never a box in a box.** A card does not sit in a card; hierarchy comes from ink
(`text-ink`, `text-ink-2`, `text-ink-3`) and size before it comes from borders. Text someone must
read for meaning (a helper, a description, a hint, an empty state's message, and meta labels: IDs,
timestamps, counts, units, group labels, column headers, a tab that is not current) is at least
`text-ink-2`, which reaches 4.5:1; `text-ink-3` (under 4.5:1) is only for placeholders, icons,
separators and what is disabled. A meta label is quieter by size and weight, not by a fainter grey.

**Accessibility.** Keep the keyboard list of each component's docs. Decorative icons are
`aria-hidden`; a status that changes sits in `role="status"`; state is never colour alone. Layout
uses logical properties (`ps-`, `me-`, `start-`, `border-s`, `rounded-se`, `text-start`), so
right-to-left works; `check` reports the physical ones (`ml-`, `pr-`, `left-`, `border-l`,
`rounded-tr`, `text-left`…) unless they sit under `ltr:` or `rtl:`. Icons are Phosphor, from
`docs icons`, each written with `data-slot="icon"`: that gives it a 1em box that never shrinks and
lets the component it sits in size and tint it.

## Design skills

When the design skills of aiforui.dev/skills are installed (often in `.claude/skills/`), read the
one that fits before the work: `emil-design-eng` for polishing a component, `animate` for
anything that moves, `choreograph` for several things moving together, `gestures` for a drag or a
sheet, `mobile-native` for phones, and `review-animations` and `break-ui` before reporting.

## Before you report

- `check` passes, and the project's typecheck passes.
- Every control is a system component, added with `add`; nothing redrawn by hand.
- Sizes from one step of the scale across a row; looks from `variant`; one primary action a view.
- Nothing animates on first paint or after a key; `appear` only on what your code adds live.
- Names of choices and numbers are whole; a narrow width wraps or scrolls.
- It works in dark and right-to-left.
- You said what you could not check (nothing run, a prop you inferred) and what the system lacked.
