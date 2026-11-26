# spec/

The sources of the look, and the schemas of every spec. Nothing in here is framework code.

| File | What it is |
| --- | --- |
| `tokens.json` | Design tokens: color (light/dark), shadow stacks, radii, type scale, spacing, easing, durations. Generates `tokens.css`, `tailwind.css`, `tokens.ts` and `components/lib/tv.ts`. Beside `$value` a token may carry `$reducedMotion` (its value under reduced motion) and `$rounded` (its value in a rounded app: `"shape": "rounded"` in a project's `fndn.json`, which the tool writes into its stylesheet, or `data-shape="rounded"` on part of a page). |
| `icons.json` | The icon vocabulary: name → Phosphor icon + weight. Generates `icons.ts`; every icon an adapter imports is listed here. |
| `schema/` | JSON Schemas: `component.schema.json` for a component's spec, `fixtures.schema.json` for its test props, and the two above. |

A component's own spec lives in its folder, `components/<name>/<name>.json`. `pnpm validate`
checks every spec against its schema *and* against the real recipe and adapters.

## How a component is described

Each component is a **contract** that its recipe and its three adapters (React, Vue, Svelte)
implement identically. The full schema is `schema/component.schema.json`.

| Field | Meaning |
| --- | --- |
| `name`, `title`, `summary`, `description` | The kebab-case id; the display name; one plain sentence; the full description. |
| `kind` | `component` (a basic building block: button, select, dialog) or `block` (built from several components for a product use: approval card, records table). The docs list them apart. |
| `category`, `order`, `status` | Its place in the catalogue; `draft`, `beta` or `stable`. |
| `element`, `anatomy` | The root element; every named part (`part`, `element`, `optional`). In the DOM the root carries `data-slot="<name>"` and each part `data-slot="<name>-<part>"` (`button`, `button-icon`); in the recipe the root is the `base` slot and each part a slot named after it in camelCase. |
| `props` | Type, values, default, description. A prop reaches the look as a recipe variant (`variant: "primary"`); `model` marks a two-way prop. State the behaviour engine (Ark UI) owns stays in its attributes (`data-state`, `aria-checked`); a number the component computes is a `--fndn-*` custom property (`--fndn-progress`, which the progress ring sets). |
| `slots`, `events` | The content slots; the events. |
| `states` | The interaction states the recipe must cover. |
| `tokens` | The tokens the component uses (`color.ink`, `shadow.card`). |
| `dependencies` | Exactly the other components its files import from (the validator compares). What it takes from `components/lib/` is not listed: that is shared code, not a component. |
| `engine`, `targets` | The Zag machine behind it; the frameworks it ships in (left out: all three). |
| `files` | Only for a component whose adapter is several files in a framework (card, table, menu, calendar): the file names, per framework. |
| `a11y`, `motion` | The role, the keyboard contract and notes; every motion, written out. |
| `notes` | What a user of the component should know that no other field says (how it composes, how to control it). |

Examples are not in the spec. The test props are in `<name>.fixtures.json` beside it, and what the
docs show are real files in the component's `examples/` folder (`docs/examples-guide.md`). A
fixture example may be a **scenario**: it carries `steps`, and changes over time (see below).

## Scenarios: examples that change over time

Agent components exist to show change (words streaming in, rows arriving, a status flipping), so
a still does not show them. An example may carry `steps`, an ordered list of
`{ "after": <ms since the previous step>, "props": { …merged over the current props… } }`:

```json
{
  "name": "Streaming",
  "props": { "content": [], "done": false, "sources": [ … ], "followUps": [ … ] },
  "steps": [
    { "after": 600, "props": { "content": [{ "text": "Annual" }] } },
    { "after": 72,  "props": { "content": [{ "text": "Annual" }, { "text": "is" }, { "text": "your" }] } },
    { "after": 480, "props": { "done": true } }
  ]
}
```

- `props` is the **first frame**: what parity compares and what a
  paused page shows. Make it meaningful on its own.
- A step merges its props over the current ones; arrays are replaced whole (send the full list).
- Rules the validator checks: every prop exists on the component, none is a `model` prop (the
  component owns those once mounted), `after` is 0 or more, the steps add up to under 20 seconds,
  and the example is not `frameworks: false`.
- The docs play a scenario once when its example is shown (Replay plays it again; the Speed
  control scales the delays). `/harness.html?…&step=<n>` renders the state after `n` steps without
  timers; `&play=1` plays it in real time. `node scripts/qa/parity.mjs --steps <name>` compares the
  three targets after every step.
- React, Vue and Svelte take each step as a prop update on the mounted component (no remount), so
  entrances and transitions behave as in an app.
