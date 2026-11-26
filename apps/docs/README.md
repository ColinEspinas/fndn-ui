# The docs site

The site at `apps/docs` (Astro, React islands) documents every component from its spec and runs
it live in React, Vue and Svelte. Its dev server (`pnpm docs`, on :4321) also serves the bare page
the browser tests drive, `/harness.html` (`src/harness`). How to work in the repository is in
[`AGENTS.md`](../../AGENTS.md).

The site is built from the library's own components and follows the same design rules
(`docs/DESIGN.md`, `docs/design/`), and these of its own:

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
