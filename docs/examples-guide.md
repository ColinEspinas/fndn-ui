# Writing examples

Everything in this library is a base and an example for an AI building UI. An example is read twice: by a person on the docs site, and by a model that copies it into a
product. So it shows **realistic product UI**: a believable situation in a software product, with
real-looking labels and data, written the way a developer would write it.

## The files

```
components/button/examples/
  index.json          { "playground": { "props": { "variant": "primary" }, "text": "Save changes" },
                        "examples": [ { "file": "save-changes", "title": "Save or cancel a form" }, … ] }
  save-changes.tsx    React: default export, takes no props
  save-changes.vue
  save-changes.svelte
```

- An example is what a user would write: it imports the component from `@fndn/react`, `@fndn/vue` or
  `@fndn/svelte` (the docs and the tool show those as the project's own paths,
  `@/components/ui/button`), icons from the Phosphor package, and nothing from the docs or the tests.
- The same base name in the three frameworks is the same example and renders the same DOM. A
  component whose spec lists `"targets": ["react"]` has `.tsx` files only.
- `index.json` gives the order and the titles. `playground` is where the docs' props panel starts;
  a component that needs data to render (items, rows) must have it there.
- The JSON props the tests render (`<name>.fixtures.json` in the component's folder: `examples`,
  `worstCase`) are test data, not documentation.

## The five rules

1. **One idea per example, named after the situation.** "Invite teammates", "Deploy failed",
   "Billing address", not "With icon", "Danger", "Small". The title says when you would reach for
   it; the code shows how. Two ideas are two examples; one idea is never spread over five.
2. **The first example is the component as it is used most.** It is also the overview card: see
   "The first example" below.
3. **Then, in this order, what exists of:** the variants that matter (each in the situation it is
   for, not a row of every value), a composition with the components it is usually used with
   (an Input in a Field, a Menu on a row's overflow Button, a StatusPill in a Table cell), and the
   states: empty, error, loading, disabled, read-only. Four to six examples is usual; more only
   when each one teaches something the others do not.
4. **Real content of realistic length.** Names, numbers and sentences a product would actually
   show (see "The world" below). No lorem, no "Item 1", no "Option A", no ice-cream shop
   (Pistachio, waffle cones, Summer menu), no "Click me". Mix lengths as real data does: one long
   project name, one short one.
5. **The code is what a developer would paste.** Imports at the top (the component from
   `@fndn/react` / `@fndn/vue` / `@fndn/svelte`, icons from Phosphor), the data in a constant above the
   markup, one default export (React) or one component (Vue, Svelte), no test scaffolding, no docs
   helpers, no `console.log` placeholders where a real handler is one line (set state, show a
   toast). Short: if the example needs a page of layout around the component, it is a block.

## The world

Examples share one fictional product so the docs read as one app: a team workspace for shipping
software (projects, deploys, code review, billing, members). Use it unless the component asks for
something else (a rating asks for feedback, a carousel for a gallery).

- **Workspace and projects:** Northwind (the team); projects `web-app`, `billing-api`,
  `mobile`, `docs-site`, `data-pipeline`; environments Production, Staging, Preview.
- **People:** Maya Chen (owner), Daniel Okafor, Priya Raman, Lucas Moreau, Aiko Tanaka,
  Sofia Alvarez, Jonas Weber. Emails `maya@northwind.example` (always the `.example` domain).
- **Things:** pull request `#482 Add retry to webhook delivery`, deploy `dpl_7f3a9c`, commit
  `a1b2c3d`, invoice `INV-2024-0117`, plans Free / Team / Business, API key `nw_live_…`,
  branch `main`, `feat/usage-alerts`.
- **Dates and numbers:** plausible and specific: `Nov 14, 2026`, `2 min ago`, `$1,240.00`,
  `98.2%`, `1,284 members`. Never a real company, person or brand.

## The first example (the overview card)

The overview shows each component's first example, live, in a card about 364 × 176 px (326 on a
phone), fitted down with CSS zoom when it is larger, never up.

- It reads at that size: the component is the subject and fills a good part of the card. A lone
  12 px dot is too little (show the spinner where it lives: in a button, beside "Deploying");
  a five-row form is too much (it shrinks to unreadable). Aim for the example's natural size to be
  at most about 320 × 136 px, so it is shown at 100%.
- Framed like its neighbours: no outer border, background or padding of its own; the card is the
  frame. A component that fills its container (a field, a table, a progress bar) may be fluid:
  the card lays it out at 320 px.
- Overlays (dialog, menu, popover, tooltip, drawer) show their trigger: make it the trigger of
  the real situation ("Invite teammates", "Delete project", a row's overflow button).

## Variants, sizes and states

- Follow the variant contract (`docs/authoring.md`, Sizes and looks): `size` is xs 24 · sm 28 ·
  md 32 · lg 36 and changes dimensions only; a look is a `variant`. Show a size where a product
  uses it (an sm Select in a toolbar beside sm Buttons), not as a row of every size.
- A status is a `StatusPill`; a label attached to something is a `Tag`. A composite example uses
  the real components, never a hand-written copy.
- A control always has an accessible name: a visible Label (or Field), or `aria-label` when the
  situation has no visible label (a toolbar icon button, a search box with a placeholder).
- States are shown as situations: "Card declined" (invalid), "No deploys yet" (empty), "Read-only
  for viewers" (disabled), not "Invalid", "Empty", "Disabled".

## Dialog or alert dialog

- **Dialog** holds any content (a form, a preview, settings) and closes on Escape, a click outside
  or its close button. Its first example: "Invite teammates" (a form in a dialog).
- **Alert dialog** interrupts to confirm a consequential action (delete, discard, revoke). It has
  no close button, ignores clicks outside, starts focus on the safe action and is announced at
  once (`role="alertdialog"`). Its first example: "Delete project" with its consequence in one
  sentence and an action labelled with the verb ("Delete project", not "OK").

## The three frameworks

The same base name in `.tsx`, `.vue` and `.svelte` is the same example and renders the same DOM.
Write the React file first, then port it line for line: the same data, the same order, the same
classes. State is `useState` / `ref` / `$state`. `index.json` gives the order, the titles and the
playground's starting props, which are realistic too (they are the first thing a reader edits).

## Before you finish

- Design rules: `docs/DESIGN.md`, and the general design skills `AGENTS.md` names (Design
  work); any motion an example adds follows `docs/design/motion.md`.
- Break it: does the example still read with the longest realistic name, in dark mode, at 390 px
  and right to left?
- `pnpm --filter examples typecheck`, and look at the page in React, then Vue and Svelte.
