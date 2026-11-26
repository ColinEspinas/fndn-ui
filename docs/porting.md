# Porting a component to another framework

The system ships adapters for React, Vue and Svelte. For another web framework (Solid, Angular,
Qwik, Lit, Web Components, plain DOM) a component is ported, not rewritten: the recipe, the
stylesheet and the helpers are framework-free and are reused unchanged; only the adapter, the thin
file that renders the parts, is written anew.

## Get the source to port from

Put the React files in a reference folder of the project, with the tool:

```bash
npx fndn init --framework react --dir src/components/ui --no-skill
npx fndn add select
```

This writes the stylesheet (`styles/`), a folder per component (`select/` with `select.recipe.ts`,
the React adapter `select.tsx` and its `index.ts`) and `lib/`: `tv.ts`, the shared recipes
`popup`, `option` and `control` that the select composes, and the helpers it imports
(among `modality.ts`, `glide.ts`, `truncate.ts`, `paint.ts`, `veil.ts`: plain TypeScript, no
framework imports). Keep everything except the `.tsx` files, which you replace with your framework's
adapters (and point each `index.ts` at them). `npx fndn docs select --framework react` prints the
contract: parts, props, events, keyboard, motion.

## Port

1. **Keep the recipe, `tv.ts`, the shared recipes and the helpers as they are**, and install
   `tailwind-variants`. Where the documentation and the recipe disagree, the recipe is what renders.
2. **Behaviour.** Use Ark UI where it exists for the framework (`@ark-ui/solid` mirrors
   `@ark-ui/react` part for part, so the React adapter translates line by line). Otherwise use the
   Zag machine the docs name under "Behaviour" (`@zag-js/<machine>`) through the framework's Zag
   adapter or `@zag-js/vanilla`. Portal and position popups through the engine's positioner, as
   the React adapter does: the stylesheet stacks positioners by `data-scope` and `data-part`.
   Components without an engine use native elements (`<button>`, `button[role=switch]`,
   `aria-expanded`).
3. **Render the DOM of the Parts table**: every part with its `data-slot` and its slot's classes
   (`const { base, trigger } = select({ size, variant })`), the caller's class on `base`.
4. **Do what the React adapter does around the DOM, no more.** `trackModality()` once (it sets
   `html[data-fndn-input]`, which the `kbd-instant` utility reads to drop transitions after a key);
   `glide(...)` for a list of options; `lib/paint.ts` against entrances on first paint;
   `lib/truncate.ts` for titles on cut text; `lib/veil.ts` for the edge veils of a table that
   scrolls sideways. Use whichever of them the React adapter uses.
5. **Props map to recipe variants** as the Props table says; a bindable prop is two-way in the
   framework's own way. Attributes go where the React adapter puts them (an `aria-label` meant for
   the control lands on the control, not on the root).
6. **Icons.** A framework without a Phosphor package inlines the SVG from `@phosphor-icons/core`,
   at the weight the icon vocabulary gives (`docs icons`), with `data-slot="icon"` and `aria-hidden`.
7. **Check.** Go through the keyboard list and the motion list of the docs one by one, then run
   `npx fndn check`.
