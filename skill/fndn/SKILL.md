---
name: fndn
description: Build UI with the fndn/ui component system (React, Vue 3, Svelte 5; Tailwind 4 recipes written with tailwind-variants; Ark UI for behaviour; Phosphor icons). Use it whenever you add or change a page, form, dialog, toolbar, table, menu, settings screen, command palette, chat or agent surface, or any component, in a project that has this system (a fndn.json at its root, a components/ui folder with one folder per component and a *.recipe.ts in each, data-slot attributes in the markup), even when the request only says "use our components"; when you customise one of its components; and when you build a component it does not have.
---

# fndn/ui

A component system copied into the project as source files the project owns. Each component is a
folder in the project's ui folder (`button/`): a recipe (`button.recipe.ts`, every Tailwind class
of every part), an adapter for the project's framework, and an `index.ts` that app code imports
from; `lib/` beside them holds what components share. Behaviour (keyboard, focus, ARIA) comes from
Ark UI. One tool, `fndn`, finds, documents, adds and checks them.

```ts
import { Button } from "@/components/ui/button";       // React and Vue
import { Button } from "$lib/components/ui/button";    // Svelte
```

Those are the default folders; `add` prints the line for this project, and `docs` writes every
example with it.

Most of what goes wrong comes from writing markup and classes by hand where a component, a prop or
a token already says what to do.

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
3. **Read** `docs <name>` for each component before you use it: the props and the examples show
   the right composition, and the list of further examples at the end often holds your case (an
   icon-only button, a form in a dialog). Laying out a whole screen: `docs design` first.
4. **Add** them with `add`, and install the packages it names. A folder that holds only a recipe
   (`checkbox/checkbox.recipe.ts`) is a look another component borrows; `add checkbox` brings the
   rest when you need it.
5. **Compose**, following the rules below.
6. **Check** (see "Before you report").
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
| The top of a screen: its title, description, back link and actions; `size="pane"` for the one-row header of a pane | `page-header` |
| Show and hide a region | `collapsible`; several: `accordion` |
| Navigation | `sidebar-nav`, `navigation-menu`, `breadcrumb`, `tabs`, `pager`, `steps` |
| A long row of named choices that may not fit | `pager` + `select`, never cut labels |
| Agent and chat surfaces: a composer, a conversation, an agent's work | `prompt-bar`, `chat-composer`, `message`, `streaming-text`, `thinking-state`, `tool-chips`, `task-rows`, `approval-card`, `agent-screen` |

What the user names wins over this table (asked for a switch in a form that saves later: use the
switch, and say that a checkbox is the convention there).

### When nothing fits

1. Use the nearest component as it is, with `class` for placement and size. (An overlay such as a
   dialog, popover or drawer takes no room of its own: place the trigger you give it.)
2. A lasting change of look is a variant in the project's copy of the recipe, not classes
   repeated at every use.
3. A new component is built the way the system builds its own: `docs authoring`, then the recipe
   and the adapter of the closest component in the project's ui folder. It gets a folder beside
   them, composes the shared recipes and helpers of `lib/`, takes behaviour from Ark UI, and marks
   every part `data-slot="<name>-<part>"`. A popup it places stands 4px from its trigger for a list
   you pick from, 6px for a popover, hover card or tooltip (`docs authoring`, Behaviour). `check`
   holds it to the same rules as the library.
4. Tell the user which piece the system was missing.

A project in another framework (Solid, Angular, Lit, plain DOM) writes only the adapter anew:
`docs porting`.

## The app's settings

Set once, for the whole app; `docs install` has the details.

- **Dark mode**: `data-theme="dark"` (or `class="dark"`) on `<html>`; the tokens carry both themes.
- **Right to left**: `dir="rtl"` on `<html>`, and Ark UI's `LocaleProvider` once at the app's root
  with the app's locale (from `@ark-ui/<framework>/locale`): the layout follows `dir`, the keyboard
  follows the provider (without it the arrow keys stay left-to-right). Components take no `dir`.
- **Shape**: buttons, toggles and segmented controls are pills. An app that wants them with a
  field's rounded corners instead (an editor, a dashboard) sets `"shape": "rounded"` in `fndn.json` (`init --shape rounded`, or
  edit it and run `update`). The `shape` prop is only for the one control that must differ.

## Rules

Each exists because breaking it is a usual mistake. "(checked)": `check` reports it, with its
reason and the fix (`docs rules`). A line that must break a checked rule carries a comment
`fndn-check-ok: <reason>` on it or on the line above.

- **Compose real components.** A part that is a button, a checkbox or a menu is that component,
  never a copy drawn with its classes: copies drift and miss the behaviour. Style a part through
  its slot (`[&_[data-slot=button-icon]]:text-ink-3`), state through its attributes
  (`data-[state=open]:`). Joined controls are a `button-group`.
- **Behaviour comes from the component.** Never hand-roll a focus trap, an active-index list or a
  positioned layer: the keyboard and screen-reader behaviour is the hard part, and it is done.
- **What you import is in the project** (checked): `add` it first.
- **Tokens only** (checked): `bg-surface`, `text-ink-2`, `border-line`, `rounded-control`,
  `shadow-raised`; no palette or literal colour, no `rounded-lg` or `shadow-md`. Layers are
  `z-popup`, `z-dialog`, `z-toast`, `z-tooltip`, never a large number (`docs tokens`).
- **Size is dimensions, look is a variant.** One height scale, `xs` 24 · `sm` 28 · `md` 32 ·
  `lg` 36; controls in one row share a size (`docs design`, Controls; the radius each height
  takes is in Shape and spacing).
- **At most one filled button in a view**, and often none: `primary`, `accent`, `success` or
  `danger`. `secondary`, a quiet grey, may sit beside it; the rest are `outline` or `ghost`
  (`docs design`, Controls).
- **One surface, never a box in a box**; hierarchy comes from ink and size before borders. Text
  read for meaning is at least `text-ink-2`; `text-ink-3` is for placeholders, icons, separators
  and what is disabled (`docs design`, Surfaces and depth; Ink and colour).
- **Names are shown whole.** Names of choices and numbers are never cut (a field may cut the
  label it has chosen, since its list shows every name whole); a row of choices that
  cannot fit becomes a `pager` + `select`; other cut text carries a `title`, and a path is cut
  in the middle (`docs design`, Laying out a screen; `docs interaction`, Layout that survives
  real data).
- **Nothing moves on first paint, and the keyboard is instant.** No component animates its own
  mount; set `appear` only on what your code adds while the user watches; what arrives later makes
  room as it fades. Keyboard changes do not animate, except the highlight of a list of options,
  which glides under the arrow keys too (`docs motion`, Mount and arrival; Choreography).
- **Motion from the vocabulary** (checked): `motion-<what>-<timing>`, `duration-*`, `ease-*`,
  `scale-press`, `scale-popup`; never Tailwind's `transition-*`, a raw duration or easing,
  `animate-spin` or a scale of your own. `animate-fade-up|fade-in|pop-in` only on what your code
  adds while the user watches, never on what the page loads with (`docs motion`, Timing).
- **Hand-written CSS** (checked): hover inside `@media (hover: hover) and (pointer: fine)`,
  `var(--fndn-duration-*)` and `var(--fndn-easing-*)`, never `transition: all`.
- **Icon-only controls are named** (checked): `aria-label` (a Toggle's `tooltip` prop also names
  it). A Tooltip around a Button shows a hint; it does not name it.
- **State is never colour alone**; a status that changes sits in `role="status"`; decorative icons
  are `aria-hidden` (`docs accessibility`).
- **Logical sides** (checked): `ps-`, `me-`, `start-`, `border-s`, `text-start`; a side meant for
  one direction goes under `ltr:` or `rtl:` (`docs design`, Type).
- **Icons are Phosphor**, from `docs icons`, with `data-slot="icon"`: a 1em box that never shrinks,
  sized and tinted by the component it sits in.

## Before you report

- `check` passes (fix every error, weigh each piece of advice), and the project's typecheck passes.
- Every control is a system component, added with `add`.
- You looked at it in light and dark, right to left and at 390px, or said you could not.
- You said what you could not check (nothing run, a prop you inferred) and what the system lacked.

## Design skills

When the design skills of aiforui.dev/skills are installed (often in `.claude/skills/`), read the
one that fits before the work: `emil-design-eng` for polishing a component, `animate` for
anything that moves, `choreograph` for several things moving together, `gestures` for a drag or a
sheet, `mobile-native` for phones, and `review-animations` and `break-ui` before reporting.
