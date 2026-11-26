# How a component is built

Every component follows this guide; one built this way looks, moves and behaves like the rest.

## 1. The shape

A component is a folder of its own name. In it: a **recipe** (every class of every part), an
**adapter** (renders the parts, calls the recipe), an `index.ts` that exports the adapter, and,
when the adapter needs some, its logic. The look lives only in the recipe, so one change restyles
every framework. What several components share is in `lib/`, beside the component folders.

```
button/
  index.ts             export * from "./button";      what app code imports
  button.tsx           the adapter (Vue: Button.vue, Svelte: Button.svelte)
  button.recipe.ts     the look
  swap.ts              logic the adapter needs (a component's own logic is <name>.logic.ts)
lib/
  tv.ts  modality.ts  glide.ts  truncate.ts  paint.ts      shared utilities
  control.ts  popup.ts  option.ts                          shared recipes
```

A file only one component needs lives in that component's folder; a component that needs
another's imports it from there (`../button/button`, `../prompt-bar/prompt-suggest`). App code
imports a component from its folder, the same way in every framework:
`import { Button } from "@/components/ui/button"`.

**Recipe** (`<name>/<name>.recipe.ts`): `tv()` from `../lib/tv` (tailwind-variants, told the token
classes so its merge keeps the right one). One element: `base`. Several parts: `slots`, the root as `base`,
each other part named after it in camelCase. Props are `variants`, with `defaultVariants`. Write
class names whole, never built from pieces: Tailwind only generates what it finds in the source.

```ts
export const chip = tv({
  base: "inline py-0.5 px-1.5 rounded-chip font-mono text-xs leading-none align-baseline",
  variants: { tone: { neutral: "bg-inset text-ink-2", accent: "bg-accent-tint text-accent-ink", red: "bg-red-tint text-red" } },
  defaultVariants: { tone: "neutral" },
});
```

**Adapter**: `data-slot="<name>"` on the root, `data-slot="<name>-<part>"` (kebab-case) on each
part, because tests, other recipes and callers find parts by slot. The caller's class goes
through the recipe on the root, so it replaces a conflicting class instead of fighting it; other
attributes spread on the root. No styling knowledge of its own: if it needs a colour, it is wrong.

```tsx
export function Chip({ tone = "neutral", className, ...rest }: ChipProps) {
  return <code data-slot="chip" className={chip({ tone, class: className })} {...rest} />;
}
```

With slots, call the recipe once, `const r = select({ size, variant })`, then `r.base({ class:
className })` on the root and `r.trigger()`, `r.value()` on the parts (Toggle, section 5). A
component that is another one with more extends it: a toggle is `tv({ extend: button, … })`.

## 2. Sizes and looks

- `size` changes **dimensions only** (height, padding, text, icon, gap, the radius step that keeps
  corners concentric), never fill, edge, ring, weight or focus, or a size silently changes meaning.
- One scale for every control a user presses or types into: **xs 24 · sm 28 · md 32 (default)
  · lg 36**, so an sm Select and an sm Button line up in a toolbar.
- A look is a `variant`, at every size. Buttons: `outline` (default), `primary`, `secondary`,
  `ghost`, `accent`, `success`, `danger`, `danger-outline`. Fields: `outline` (default),
  `subtle`, `ghost` (no fill until touched, as for buttons). `shape` is the radius only (`pill`,
  `rounded`) and has no default: left out, a button, toggle or segmented control takes the app's
  shape, `rounded-shape` (`rounded-shape-sm` up to 28px), a pill unless the project's `fndn.json`
  says `"shape": "rounded"` (or an ancestor carries `data-shape="rounded"`). A component that renders Buttons passes no shape on: they follow the app
  by themselves. Reuse these names so a reader can guess the prop.
- A scale keeps its proportions: what sits inside a sized thing (an avatar's initials, a
  control's icon) is checked at every size with the widest content it takes, not designed at one
  size and stepped by eye. An avatar's two initials take about two thirds of its edge at every
  size from 16 to 40px.

## 3. State

- State the engine owns stays in its attributes, styled with Tailwind variants (`data-[state=open]:`,
  `aria-pressed:`, `data-disabled:`): the engine keeps them true, a copy would drift.
- State the adapter knows (`swapped`, `busy`, `appear`) is a recipe **variant**, never an
  attribute that repeats a prop (`data-size`): the prop already reached the recipe. A number
  computed in script is a `--fndn-*` custom property (`--fndn-row-index`).
- A part that reacts to another names it by slot: `[[data-slot=select-trigger][data-state=open]_&]:rotate-180`.
  Not `group-*`, which a nested component would match. Inside `[...]`, `_` is a space.
- A part another component renders (the pager's previous button is a `<Button>`, already
  `data-slot="button"`) is marked after your component: `<Button data-pager="prev" …>`.

## 4. Compose, never copy

A part that is a button, a checkbox, a tooltip or a menu **is** that component
(`<Button variant="ghost" size="sm" square>`), never markup redrawn by hand, so a fix reaches
every place it appears. A useful part that exists nowhere becomes a component or variant first.

The shared recipes of `lib/` are composed into a slot; the outer `tv` merges, so your classes win:

| In `lib/` | Use it for |
| --- | --- |
| `control` | The surface of every field-like control (input, textarea, select or combobox trigger, date field). Variants `size`, `variant`, `kind`: `field` rings on any focus, `trigger` on keyboard focus and while open. Exports `controlSize`, `controlVariant`. |
| `popup` | The raised box of every trigger-anchored popup (select and menu content, popover, hover card): surface, `shadow-raised`, scroll, scale-in from the trigger, keyboard-instant. Not tooltips or dialogs. |
| `option` | One row of a list you pick from: slots `base`, `icon`, `text`, `description`, `meta`, `indicator`, `label`, `separator`. Labels wrap, never cut. |
| `glideLayer` (in `glide.ts`) | The classes of the one highlight that travels between rows. Every list has one; a row never paints its own hover. |

```ts
const row = option();
const ctl = control({ kind: "trigger" });
export const select = tv({
  slots: {
    trigger: [ctl.base(), "inline-flex items-center justify-between gap-1.5"],
    content: [popup(), "w-max min-w-[max(var(--reference-width,0px),120px)]"],
    highlight: [glideLayer, "inset-x-1"],
    item: row.base(), itemText: row.text(), itemIndicator: row.indicator(),
  },
  variants: { size: { sm: { trigger: controlSize.sm, content: "[--option-height:26px]" } } },
});
```

The shared helpers of `lib/` (plain DOM TypeScript, the same in every framework):

| Helper | Use it when |
| --- | --- |
| `modality.ts` `trackModality()` | Any interactive component: marks the last input on `<html>`, which `kbd-instant`, `kbd:` and the pointer-only press read. Idempotent. |
| `truncate.ts` `truncationTitles(el, selector?)`, `middleTruncation(…)` | A part can be cut: it carries a `title` with the full text while cut. Middle cut for paths and ids. |
| `glide.ts` `glide(list, layer, { rows, follow })` | The list has a highlight layer (`glideLayer`): moves it to the `data-highlighted` row or the hovered one. |
| `paint.ts` `afterPaint(fn)` | Something may only start after the first paint (arming an entrance). |

## 5. Behaviour

Interactive components take keyboard, focus and ARIA from **Ark UI** (`@ark-ui/react`,
`@ark-ui/vue`, `@ark-ui/svelte`; Zag.js underneath). Never hand-roll a focus trap, an
active-index list, type-ahead or a positioned layer: that is where subtle bugs live, and Ark
gives one model in all three frameworks. Simple controls keep native semantics (a `<button>`,
`aria-expanded` on a disclosure). Put your slot and classes on the Ark part, pass its props on:

```tsx
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { pressed, defaultPressed, onPressedChange, variant = "outline", size = "md", icon, className, children, ...rest }, ref,
) {
  useEffect(() => trackModality(), []);
  const r = toggle({ variant, size });
  return (
    <ArkToggle.Root ref={ref} pressed={pressed} defaultPressed={defaultPressed}
      onPressedChange={onPressedChange} data-slot="toggle" className={r.base({ class: className })} {...rest}>
      {icon && <span data-slot="toggle-icon" className={r.icon()} aria-hidden>{icon}</span>}
      {children != null && <span data-slot="toggle-label" className={r.label()}>{children}</span>}
    </ArkToggle.Root>
  );
});
```

- Two-way props: React `x`/`defaultX`/`onXChange`; Vue `v-model:x`; Svelte `bind:x` + `onxchange`.
- Popups render in Ark's `Portal`: no slot may depend on the root being an ancestor. Place them
  with `positioning={{ placement, gutter }}`: a list you pick from (a select's, a combobox's, a
  menu and its sub-menus, a date picker) stands 4px clear of its trigger, `gutter: 4`; a popover,
  a hover card and a tooltip 6px.
- Icons are Phosphor (`@phosphor-icons/react|vue`, `phosphor-svelte`), `data-slot="icon"`.

## 6. Motion

Motion is feedback and orientation, never decoration; when unsure, nothing moves. All of it comes
from the stylesheet's utilities, so timings stay consistent and reduced motion is handled once.

| Utility | Meaning |
| --- | --- |
| `motion-<what>-<timing>` | A transition. what: `colors` `opacity` `shadow` `transform` `filter` `size` `radius`. timing: `fast` `base` `slow` (ease) · `press` `move` `reveal` `popup` `tooltip` `enter` `fast-out` `base-out` `slow-out` (strong ease-out) · `glide` (the in-out curve of sliding thumbs). They compose: `motion-colors-fast motion-shadow-base motion-transform-press`. `motion-also-[…]` adds one written out. |
| `duration-*`, `delay-*` | `fast` 100 · `tooltip` 125 · `base` 150 · `press` 160 · `popup` 180 · `reveal`, `move` 200 · `slow` 250 · `enter` 300 · `stagger` 40 (ms). |
| `ease-*` | `out-strong` (enter, exit, press, popup), `in-out-strong`, `move` (thumbs), `drawer`, `link`. |
| `scale-press`, `scale-press-sm`, `scale-popup`, `scale-y-popup` | Press (0.97; 0.9 for controls of 20px or less); popup start and end (0.96, with `starting:`), along the block axis only for a popup as wide as its trigger. |
| `animate-fade-up`, `-fade-in`, `-pop-in` | One-shot entrances of content. |
| `kbd-instant`, `kbd:` | Skip transitions while the last input was the keyboard; a variant for anything else that differs then. |
| `hover:` | Already gated to a real pointer: a tap never leaves it stuck. |

- **Press scales from the pointer only**: `motion-transform-press [:root:not([data-fndn-input=keyboard])_&:active]:scale-press`,
  with `trackModality()` running. Rows, options and fields (a select's trigger, in every look)
  press with a darker background instead: a scale takes a share of the width, and they are as wide
  as their container.
- **Keyboard changes are instant** (`kbd-instant` on popups, carets, thumbs, indicators), except
  the `glide` highlight, which glides under the keyboard too.
- **Nothing animates on mount**; only arrivals after the first paint enter. A component that shows
  arrivals takes `appear` (default `false`), set by the code appending an item live: only it knows the item is new.
- **Arrivals make room**: a row opens `grid-rows-[0fr]` → `[1fr]` (`motion-size-reveal`) as it fades, never in one frame.
- **Never Tailwind's `transition-*`, a raw duration, a `cubic-bezier()`, or `scale(0)`**; animate
  `transform` and `opacity`, not layout. The rest (what deserves motion, choreography, reduced
  motion, check and radio marks) is in the Motion rule book (`docs motion`).

## 7. Tokens

Colours, radii, shadows and type come from token utilities, so both themes and any retheme work
without touching the component. No palette colour (`bg-gray-100`), no hex or `oklch()` of your
own, no `z-index` number for stacking.

- **Surfaces**: `page` app background · `canvas` recessed, behind cards · `surface` card, panel,
  popup · `inset` well inside a surface · `field` input. **Fills**: `hover` hover, the glide ·
  `hover-2` press, open, current. **Edges**: `line` hairline · `line-strong` control edge · `line-soft`.
- **Text**: `ink` primary · `ink-2` secondary, and anything read for meaning (helper text,
  descriptions, hints, an empty state's message, and meta labels: IDs, timestamps, counts, units,
  group labels, property labels, column headers, a tab, segment or breadcrumb that is not
  current) · `ink-3` placeholders, icons at rest, separators, decoration and what is disabled,
  never text that says something; a meta label is quieter than its neighbour by size and weight,
  not by a fainter grey · `on-ink`, `on-accent` on those fills. **Status**, sparingly: `accent`,
  `accent-ink`, `accent-tint`; `green`, `orange`, `red` (success, warning, danger) and `-tint` washes.
- **Shadows**: `shadow-hairline` 1px ring · `btn` · `card` · `raised` popups · `overlay` dialogs.
  **Radii**: `rounded-chip` 6 · `control` 8 · `card` 10 · `window` 14 · `pill`.
- **Type**: `text-2xs` 11 · `xs` 12 · `dense` 12.5 (popup options, table headers, code) · `sm` 13 ·
  `md` 14 (body) · `lg` 16 · `xl` 20; `font-sans`, `font-mono`; spacing on Tailwind's 4px scale.
  **Stacking**: `z-popup` < `z-dialog` < `z-toast` < `z-tooltip`, on Ark's positioner;
  inside a component `relative z-1` only lifts text above its glide.

## 8. Accessibility floor

- Keyboard contracts follow the Accessibility rule book (`docs accessibility`); Ark provides them,
  do not override keys.
- Icon-only controls have a name (`aria-label`); decorative icons are `aria-hidden`; form
  controls are wired to their label and hint (`aria-describedby`, `aria-invalid`).
- The focus ring is never removed without a replacement, never fades, never changes the shape. State
  is never colour alone (forced colours drop it); status that changes while waiting is `role="status"`.
- Logical properties (`ps-`, `me-`, `start-`) for right-to-left; author text keeps its direction
  (`[unicode-bidi:plaintext]`); text fields are 16px on coarse pointers, or iOS zooms the page.
  `check` reports a physical side: `ml-` `mr-` `pl-` `pr-` (and `scroll-`), `left-` `right-`,
  `border-l` `border-r`, `rounded-l` `rounded-r` and the four corners, `text-`, `float-` and
  `clear-left`/`right`, and the same sides as arbitrary properties. A side meant for one direction
  goes under `ltr:` or `rtl:`; a position that is physical on purpose (an engine's offsets, which
  are page coordinates) is written as the property, `[left:0]`.
- Names of choices and numbers are never cut: they wrap. Other cut text gets a `title`. Contrast
  4.5:1 for body text, 3:1 for large text and control edges, in both themes.

## 9. Examples

An example is copied by people and by models, so it shows **realistic product UI**.

- One idea per example, named after the situation: "Deploy environment", "Filters in a
  toolbar", "Card declined"; never "With icon", "Small", "Invalid".
- First the component as it is used most; then the variants that matter, each in its situation;
  a composition with its usual neighbours; the states (empty, error, loading, disabled).
- Real content of realistic, mixed length (a team workspace shipping software: projects, deploys,
  members, billing; emails on `.example`). No lorem, "Item 1", "Option A", "Click me".
- Code a developer would paste: imports, data in a constant above the markup, one component, a
  real one-line handler. A size where a product uses it, not a row of every size.

## 10. Before it is done

- [ ] Recipe: `base`, or `slots` = root `base` + every part in camelCase; props are variants.
- [ ] Every part has `data-slot`; the caller's class goes through the recipe on the root.
- [ ] No attribute repeats a prop; engine state styled through its own attributes.
- [ ] `size` changes dimensions only, on xs 24 · sm 28 · md 32 · lg 36; looks are `variant`s.
- [ ] Parts that are components render them; lists use `popup`, `option`, `glide`.
- [ ] Keyboard and focus from Ark UI; `trackModality()` runs in interactive components.
- [ ] Every colour, radius, shadow and size is a token utility; no stacking number.
- [ ] Motion only from the motion utilities; no hand-written `:hover`.
- [ ] Press from the pointer only; keyboard changes instant; nothing plays on mount.
- [ ] Logical properties; long, short, empty and right-to-left data still read; cut text has a `title`.
- [ ] Icon-only controls named; examples are realistic situations, one idea each.

## 11. In the library's repository

Here a component's folder holds all three adapters, and more. The adapters render **the same
DOM** (elements, slots, attributes): a check compares them on every example. A component is done
when that check and its test pass in all three; typechecking is not enough, the Vue and Svelte
compilers are stricter.

| In `components/<name>/` | What |
| --- | --- |
| `<name>.json` | The spec: the contract (below), the source of truth. |
| `<name>.recipe.ts`, `<name>.logic.ts` | The recipe; logic the adapters share, DOM only. |
| `<name>.tsx`, `<Pascal>.vue`, `<Pascal>.svelte` | The adapters. A component of several files lists them in the spec's `files`. |
| `<name>.fixtures.json` | `{ "examples": [...], "worstCase": [...] }`: JSON props the tests render. |
| `<name>.test.mjs` | Keyboard and pointer test, all three frameworks, on `/harness.html?c=<name>&fw=react&ex=0`. |
| `examples/` | `index.json` (order, titles, playground props) and one file per example and framework. |

There is no `index.ts` here (three frameworks share the folder): the tool writes one into a
project, and `packages/{react,vue,svelte}/src/index.ts` export every adapter as `@fndn/react`,
`@fndn/vue` and `@fndn/svelte`, which is what the example files import.

| Spec field | Meaning |
| --- | --- |
| `name`, `title`, `summary`, `description` | kebab-case id; display name; one plain sentence; the full description. |
| `kind`, `category`, `order`, `status` | `component` or `block`; place in the catalogue; `draft`, `beta`, `stable`. |
| `element`, `anatomy` | Root element; every part (`part`, `element`, `optional`). |
| `props`, `slots`, `events` | Type, values, default, description (`model` marks two-way); content slots; events. |
| `states`, `tokens` | Interaction states the recipe covers; the tokens it uses. |
| `dependencies`, `engine`, `targets` | Exactly the other components its files import from; the Zag machine; frameworks shipped (left out: all three). |
| `a11y`, `motion` | Role, keyboard contract and notes; every motion written out. |

Generated, never edited by hand: `components/lib/tv.ts`, `packages/core/css/tokens.css`,
`tailwind.css`, `packages/core/src/tokens.ts`, `icons.ts` (`pnpm build:tokens`, from
`spec/tokens.json` and `spec/icons.json`, which lists every icon an adapter imports), and the
three package indexes with `packages/core/css/index.css` (`pnpm build:indexes`, after adding a
component or changing what an adapter exports). What Tailwind cannot say (`@keyframes`, a rare
structural selector) goes in `packages/core/css/base.css`.

The rule books (`docs/DESIGN.md`, `docs motion`, `docs interaction`, `docs accessibility`) hold
rules and their reasons only, with no history and no repository tooling, because the tool serves
them as they are to other projects. They describe what is built: where a rule book and the
components disagree, find out which one is wrong and fix it, rather than leave them apart. They
are the only place a design rule is written: where a general design skill in `.claude/skills/`
disagrees with them, the rule book wins. What checks the rules here:

| Rule | Checked by |
| --- | --- |
| Timings and easings from tokens; no `transition: all`, `scale(0)` or layout transition; hover gated; keyframes known; icon-only controls named | `packages/cli/src/rules.js`: `pnpm validate` here, `check` in a project |
| A press never equals its hover; no hover out-ranks the press; `ease-move` only on a thumb, indicator or reel; shared atoms exist once | `scripts/lint-composition.mjs`, part of `pnpm validate` |
| Popup lists compose `popup` and stack on their positioner; the highlight glides, under the keyboard too | `scripts/qa/foundation.mjs`, `scripts/qa/glide.mjs` |
| Names of choices shown whole; a row that does not fit becomes a pager and a select | `select.test.mjs`, `code-block.test.mjs` |
| The same DOM in the three frameworks; nothing breaks on worst-case data | `scripts/qa/parity.mjs`, `scripts/qa/worst.mjs` |

Feel and alignment are checked by eye: the docs site's view options slow every animation down,
and screenshots are taken at device pixel ratios 1, 1.25, 1.5 and 2 (`launch({ dpr })` in
`scripts/qa/cdp.mjs`).

```bash
node scripts/validate.mjs <name>          # spec ↔ recipe ↔ adapters, dependencies ↔ imports, the rules of `check`
node scripts/qa/run.mjs --fast <name>     # while working: React only
node scripts/qa/run.mjs <name>            # done: typechecks, same-DOM check, the test, worst cases
pnpm check                                # the whole repository
```

The docs site (`apps/docs`) follows the same rules, and these of its own:

- **No transition between pages, and no flicker**: the new page is complete in its first frame,
  and the chosen framework holds from the first paint and across pages.
- **The content column is capped and centred** on every kind of page (`mx-auto` on the column;
  the overview's column is wider).
- **View options act on the whole page**, so they sit in the top bar, not on a component.
  Components and blocks are listed apart; the overview shows each one live.
- **A preview sits on a solid surface or canvas**: parts without a fill of their own read as
  broken over a dotted ground.
- **The props panel drives two-way props on the live component**, so a value set there (a
  carousel's `page`) travels as it would in an app.
