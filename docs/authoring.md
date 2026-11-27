# How a component is built

Every component follows this guide; one built this way looks, moves and behaves like the rest.
It says how a component is put together. The design rules it must meet are in the rule books
(`docs design`, `docs motion`, `docs interaction`, `docs accessibility`); this guide points to
them and does not repeat them.

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
  tv.ts  modality.ts  glide.ts  truncate.ts  paint.ts  veil.ts      shared utilities
  control.ts  popup.ts  option.ts                                   shared recipes
```

A file only one component needs lives in that component's folder; a component that needs
another's imports it from there (`../button/button`, `../prompt-bar/prompt-suggest`). App code
imports a component from its folder: `import { Button } from "@/components/ui/button"` in React
and Vue, `"$lib/components/ui/button"` in Svelte.

**Recipe** (`<name>/<name>.recipe.ts`): `tv()` from `../lib/tv` (tailwind-variants, told the token
classes so its merge keeps the right one). One element: `base`. Several parts: `slots`, the root
as `base`, each other part named after it in camelCase. Props are `variants`, with
`defaultVariants`. Write class names whole, never built from pieces: Tailwind only generates what
it finds in the source.

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
attributes spread on the root. When the adapter renders a wrapper around its control (a switch
inside its label), `class` and `style` land on the outermost element, which is what a caller sizes
and places, and every other attribute stays on the control. The adapter has no styling knowledge
of its own: if it needs a colour, it is wrong.

```tsx
export function Chip({ tone = "neutral", className, ...rest }: ChipProps) {
  return <code data-slot="chip" className={chip({ tone, class: className })} {...rest} />;
}
```

With slots, call the recipe once, `const r = select({ size, variant })`, then `r.base({ class:
className })` on the root and `r.trigger()`, `r.value()` on the parts (Toggle, section 5). A
component that is another one with more extends it: a toggle is `tv({ extend: button, … })`.

## 2. Sizes and looks

The sizes and looks themselves, and which to use where, are in `docs design` (Controls). A
component meets them this way:

- `size` changes **dimensions only** (height, padding, text, icon, gap, the radius step that keeps
  corners concentric), never fill, edge, ring, weight or focus, or a size silently changes meaning.
  A control a user presses or types into takes the one height scale, so an sm Select and an sm
  Button line up in a toolbar.
- A look is a `variant`, at every size. Reuse the names the Button and the fields use (`outline`,
  `primary`, `ghost` …), so a reader can guess the prop.
- **A prop or a look is made for every screen that could use it, never for one.** When a screen
  needs something a component lacks, first build it from the looks the system already has (the
  pill tabs, the ghost toggle). Only when none fits, design what the component is missing in
  general, in the system's own look. A look copied from another product (a browser's tabs, an
  editor's activity-bar mark) is not the system's, and a prop that only one screen sets is a
  screen's detail leaking into the contract. A product's name in a prop's description is the sign
  of one.
- `shape` is the radius only (`pill`, `rounded`) and has no default. A control of your own that
  follows the app's shape takes `rounded-shape` (`rounded-shape-sm` up to 28px): a pill, unless the
  project's `fndn.json` says `"shape": "rounded"` or an ancestor carries `data-shape="rounded"`. A
  component that renders Buttons passes no shape on: they follow the app by themselves.
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
- **A state a component measures on itself** (the segmented control's `data-overflow`, set while
  its options are wider than its box) is never set on a component with no box (`display: none` on
  it or above it): there is nothing to measure, and the state's layout would bring back a
  component its app has hidden. Such a state leaves the `display` alone wherever it can. A hidden
  control that counted as overflowing took the display of its scrolling state, fitted, was hidden
  again, and flipped on every frame.
- **A staggered group entrance** delays each item by
  `calc(min(var(--fndn-row-index,0),var(--fndn-motion-stagger-max))*var(--fndn-duration-stagger))`,
  with a fill mode of `both`. The adapter sets `--fndn-row-index` only on the items present at
  mount, so an item that arrives later (a streamed row) enters with no delay.
- **An overlay open at mount** (`defaultOpen`, or `open` already true) marks its parts
  `data-mounted-open` until it first closes, and the recipe's `@starting-style` entrance skips them
  (`not-data-mounted-open:`): it is simply there. Its close, and every later open, animate as usual.

## 4. Compose, never copy

A part that is a button, a checkbox, a tooltip or a menu **is** that component
(`<Button variant="ghost" size="sm" square>`), never markup redrawn by hand, so a fix reaches
every place it appears. A check or radio mark anywhere (a menu, a card, a table) is the checkbox's
or the radio's markup. A useful part that exists nowhere becomes a component or variant first.

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
| `veil.ts` `watchVeils(scroller, { axis, hold })` | A part scrolls and fades the edge it continues past: keeps `data-overflow-start` and `data-overflow-end` on the scroller while content is hidden past that edge, from the scroll position (right-to-left included), so the recipe paints each veil from its attribute. Same in every browser: no scroll-driven animation. Call it before the first paint. |

## 5. Behaviour

Interactive components take keyboard, focus and ARIA from **Ark UI** (`@ark-ui/react`,
`@ark-ui/vue`, `@ark-ui/svelte`; Zag.js underneath). Never hand-roll a focus trap, an
active-index list, type-ahead or a positioned layer: that is where subtle bugs live, and Ark
gives one model in all three frameworks. Do not override the keys it handles. Simple controls
keep native semantics (a `<button>`, `aria-expanded` on a disclosure). Put your slot and classes
on the Ark part, pass its props on:

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
  with `positioning={{ placement, gutter }}`. A list you pick from (a select's, a combobox's, a
  menu and its sub-menus, a date picker) stands 4px clear of its trigger, `gutter: 4`, close
  enough to read as the field's continuation; a popover, a hover card and a tooltip, which are
  separate content, stand 6px clear.
- A drag handler never takes the focus a press gives. Refusing a press's default (to stop it
  selecting text) also refuses its focus, and the keys then act on nothing. Refuse `selectstart`
  and `dragstart` while the pointer is held, and leave the press alone.
- Icons are Phosphor (`@phosphor-icons/react|vue`, `phosphor-svelte`), `data-slot="icon"`.

## 6. Motion

All motion comes from the stylesheet's utilities (`motion-<what>-<timing>`, `duration-*`, `ease-*`,
`scale-press`, `scale-popup`, `kbd-instant`), so timings stay consistent and reduced motion is
handled once: the table is in `docs motion` (Timing). What deserves motion, the press, the keyboard,
mount and arrivals are in `docs motion` and `docs interaction` (Press). A component that shows
arrivals takes `appear` (default `false`); the code that adds an item live sets it, because only
that code knows the item is new. In the recipe `appear` is a variant: `false` puts `animate-none`
on the parts that would enter, so the entrance is always written and plays only when asked for.

How a motion feels cannot be read from the code: play it slowed down and step through it, try a
gesture on a real phone, and look again later.

## 7. Tokens

Colours, radii, shadows, type and stacking are token utilities (`docs tokens`; what each one is for:
`docs design`). No palette colour, hex, `oklch()` or `z-index` number; inside a component,
`relative z-1` only lifts text above its glide.

## 8. Accessibility floor

The floor is `docs accessibility`; Ark UI gives the keyboard. What is left to the builder: form
controls are wired to their label and hint (`aria-describedby`, `aria-invalid`); a text field is
16px on coarse pointers, or iOS zooms the page; a position that is physical on purpose (an
engine's offsets, which are page coordinates) is written as the property, `[left:0]`, so `check`
does not take it for a missed logical side.

## 9. Before it is done

- [ ] Recipe: `base`, or `slots` = root `base` + every part in camelCase; props are variants.
- [ ] Every part has `data-slot`; the caller's class goes through the recipe on the root.
- [ ] No attribute repeats a prop; engine state styled through its own attributes.
- [ ] `size` changes dimensions only, on xs 24 · sm 28 · md 32 · lg 36; looks are `variant`s.
- [ ] Parts that are components render them; lists use `popup`, `option`, `glide`.
- [ ] Keyboard and focus from Ark UI; `trackModality()` runs in interactive components.
- [ ] Every colour, radius, shadow and size is a token utility; no stacking number.
- [ ] Motion only from the motion utilities; hover through the `hover:` variant, which is gated
      to a real pointer (a `:hover` written by hand carries the same media query).
- [ ] Press from the pointer only; keyboard changes instant; nothing plays on mount.
- [ ] Logical properties; long, short, empty and right-to-left data still read; cut text has a `title`.
- [ ] Icon-only controls named.
- [ ] Looked at in the browser, not only read (code cannot settle how a motion feels): light and
      dark, 390px, right to left, its animations at full speed and slowed down.

## 10. In the library's repository

Here a component's folder holds all three adapters, and more. The adapters render **the same
DOM** (elements, slots, attributes): a check compares them on every example. A component is done
when that check and its test pass in all three; typechecking is not enough, the Vue and Svelte
compilers are stricter.

| In `components/<name>/` | What |
| --- | --- |
| `<name>.json` | The spec: the contract, the source of truth. Its fields: `spec/README.md`. |
| `<name>.recipe.ts`, `<name>.logic.ts` | The recipe; logic the adapters share, DOM only. |
| `<name>.tsx`, `<Pascal>.vue`, `<Pascal>.svelte` | The adapters. A component of several files lists them in the spec's `files`. |
| `<name>.fixtures.json` | `{ "examples": [...], "worstCase": [...] }`: JSON props the tests render. |
| `<name>.test.mjs` | Keyboard and pointer test, all three frameworks, on `/harness.html?c=<name>&fw=react&ex=0`. |
| `examples/` | `index.json` (order, titles, playground props) and one file per example and framework: how to write them is `docs/examples-guide.md`. |

The showcases (`showcases/`) use the components as they are. What a showcase lacks is designed
for the component (section 2) and shown by an example of the component's own, which does not copy
the showcase's screen.

There is no `index.ts` here (three frameworks share the folder): the tool writes one into a
project, and `packages/{react,vue,svelte}/src/index.ts` export every adapter as `@fndn/react`,
`@fndn/vue` and `@fndn/svelte`, which is what the example files import.

The generated files, never edited by hand, are listed in `AGENTS.md` (Rules), and the commands
that write them in its Commands table; `packages/cli/data/`, the data the tool serves, is written by `pnpm build` too
and is not in git. What Tailwind cannot say (`@keyframes`, a rare structural selector) goes in
`packages/core/css/base.css` (a project's `styles/base.css`). Where the rule books and the components disagree, and what wins over
a general design skill: `AGENTS.md` (Read before you change something; Design work). The
commands are in `AGENTS.md` (Commands).

What checks the rules here:

| Rule | Checked by |
| --- | --- |
| Timings and easings from tokens; no `transition: all`, `scale(0)` or layout transition; hover gated; an animation names a keyframe that exists (a shared `fndn-*` one, or one its own stylesheet defines); icon-only controls named | `packages/cli/src/rules.js`: `pnpm validate` here, `check` in a project |
| A press never equals its hover; no hover out-ranks the press; `ease-move` only on a thumb, indicator or reel slot; shared atoms exist once | `scripts/lint-composition.mjs`, part of `pnpm validate` |
| Popup lists compose `popup` and stack on their positioner; the highlight glides, under the keyboard too | `scripts/qa/foundation.mjs`, `scripts/qa/glide.mjs` |
| Names of choices shown whole; a row that does not fit becomes a pager and a select | `select.test.mjs`, `code-block.test.mjs` |
| The same DOM in the three frameworks; nothing breaks on worst-case data | `scripts/qa/parity.mjs`, `scripts/qa/worst.mjs` |

Feel and alignment are checked by eye, under the conditions `AGENTS.md` lists (Design work); the
docs site's view options slow every animation down. The docs site has a few rules of its own:
`apps/docs/README.md`.
