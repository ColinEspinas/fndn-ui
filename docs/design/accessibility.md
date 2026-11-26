## Accessibility

**Behaviour that is easy to get subtly wrong is never hand-written.** Every component with real
keyboard and focus logic runs on Ark UI (Zag.js underneath: `@ark-ui/react`, `@ark-ui/vue`,
`@ark-ui/svelte`), so the keyboard model, the ARIA wiring and the DOM are the same in every
framework. `docs <name>` names the machine a component runs on; building on Ark is in
`docs authoring` (Behaviour).

**Simple controls keep native semantics**: a `<button>` is a button, a disclosure is a button with
`aria-expanded`, a switch is `button[role="switch"]` with `aria-checked`.

### Keyboard contract

| Pattern | Keys |
| --- | --- |
| Button, icon button | `Enter`, `Space`. |
| Switch | `Space`, `Enter` toggle. |
| Disclosure (a thinking trace, a task row, a tool run) | `Enter`, `Space` toggle; focus stays on the trigger, which points at its region (`aria-controls`). |
| Segmented control, radio group | One tab stop. Arrow keys move and select, `Home` / `End` jump. |
| Checkbox group | Each box is a tab stop; `Space` toggles. |
| Tabs | One tab stop. Arrow keys move and select (selection follows focus), `Home` / `End` jump. |
| Listbox | One tab stop. `ArrowDown` / `ArrowUp` move the highlight, `Home` / `End` jump, typing jumps to a match, `Enter` or `Space` choose. |
| Combobox, search | Focus stays in the field. Typing filters, `ArrowDown` / `ArrowUp` move the highlight, `Home` / `End` jump, `Enter` chooses. `Escape` closes a combobox's list (a second `Escape` restores the chosen label) and clears a search. |
| Select | `Enter`, `Space`, `ArrowDown` or `ArrowUp` open; arrows move; type-ahead; `Enter` or `Space` select; `Escape` closes and returns focus to the trigger. |
| Menu | `Enter`, `Space` or `ArrowDown` open; arrows move; type-ahead; `Enter` or `Space` activate; `Escape` closes and returns focus to the trigger. |
| Tooltip | Shows on focus and hover; `Escape` hides it. Never holds anything interactive. |
| Popover | Focus moves in (to the first focusable, else the surface); `Escape` closes and returns focus to the trigger. |
| Hover card | Opens on focus; `Escape` closes; focus stays on the trigger. Anything essential in it is reachable another way. |
| Dialog | Focus moves in and is trapped; `Escape` closes; focus returns to the trigger; the page behind is inert. |
| Table of toggleable rows | One tab stop; `ArrowDown` / `ArrowUp` move between rows, `Home` / `End` jump; `Enter` / `Space` toggle. |

Changes made from the keyboard are instant: see `docs motion`.

### Names, roles, announcements

- **Every icon-only control has an accessible name** (`aria-label`). When it also needs a Tooltip:
  `docs design` (Controls).
- **Decorative icons and marks are `aria-hidden="true"`.**
- **Status that changes while the user waits** (a thinking label, a loading state, a task's
  status) sits in a `role="status"` region. Streaming text is not announced word by word; announce
  it when it completes.
- **A group of related controls has a group role and a label** (`role="radiogroup"` with
  `aria-label`).
- **Form controls are wired to their label and hint** (`for` and `id`, `aria-describedby`,
  `aria-invalid`).

### Also required

- **Contrast**: at least 4.5:1 for body text, 3:1 for large text and control boundaries, in both
  themes. Which ink is for what: `docs design` (Ink and colour). **What must be read for meaning
  is at least `ink-2`** (helper text and hints under a field, descriptions of options, settings,
  dialogs and cards, an empty state's message, a caption that explains a value, a status line,
  and the meta labels: IDs, timestamps, counts, units, group labels, property labels, column
  headers, a tab, a segment or a breadcrumb that is not current); `ink-3` is only for
  placeholders, icons, separators and decoration, and what is disabled. Measured (WCAG ratio):

  | Ink | page | canvas | inset | surface | field | hover | hover-2 |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | `ink-2` light | 5.60 | 5.22 | 5.51 | 5.85 | 5.22 | 5.36 | 4.80 |
  | `ink-2` dark | 7.45 | 7.35 | 6.85 | 6.52 | 5.87 | 5.95 | 5.37 |
  | `ink-3` light | 2.61 | 2.43 | 2.56 | 2.72 | 2.43 | 2.50 | 2.24 |
  | `ink-3` dark | 3.52 | 3.48 | 3.24 | 3.08 | 2.77 | 2.81 | 2.54 |

  Disabled text is exempt. A placeholder is `ink-3`, so it never stands in for a label or a hint.
- **Zoom and width**: works at 200% zoom and at 320px wide without losing content or function.
- **Right-to-left**: logical utilities, see `docs design` (Type).
- **Forced colours**: state is never colour alone (`docs design`), and focus rings are outlines,
  which forced-colours mode keeps.
- **Reduced motion**: honoured through the tokens, see `docs motion`.
