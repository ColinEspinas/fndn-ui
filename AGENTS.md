# fndn/ui

A UI toolkit built for AI agents first. One spec per component feeds one Tailwind recipe
(tailwind-variants) and thin adapters for React, Vue and Svelte that render the same DOM. The
components reach a project as source files it owns, through the system's own tool (a command
line that is also an MCP server), which also checks the project against the rules the components
follow. The goal: whoever uses it, in whichever framework, gets the same components, the same
quality, motion and smoothness, and keeps them when they extend the library or build larger
screens with it.

The design language derives from Beautiful UI (MIT, see `NOTICE`); it is a base, not a clone.
The name is fndn, written fndn/ui. The tool is the npm package `fndn` (its command is `fndn`);
the packages inside this repository (`@fndn/*`) are internal and are not published. The token
prefix is `--fndn-`, attributes are `data-fndn-*`, keyframes `fndn-*`, a project's config file is
`fndn.json`, the check's opt-out comment is `fndn-check-ok: <reason>`, and the skill `init`
writes into a project goes to `.claude/skills/fndn/`.

When in doubt about structure, do it the way shadcn/ui does. The library covers shadcn's and
Zag's components in this design; for now it leaves out a colour picker, angle slider, signature
pad, QR code, tour, timer, marquee, floating panel, image cropper, cascade select, chart and
JSON tree.

This file is the guide for anyone working on the repository, a person or a coding agent. It is
written to be read by an agent at the start of every task.

## Map

| Where | What |
| --- | --- |
| `components/<name>/` | One folder per component, with everything about it: the spec (`<name>.json`, its contract), the recipe (`<name>.recipe.ts`, every class of every part), the logic its adapters share (`<name>.logic.ts`), the React, Vue and Svelte adapters, its browser test (`<name>.test.mjs`), its test props (`<name>.fixtures.json`) and its examples (`examples/`). |
| `components/lib/` | What several components share: `tv.ts` (generated), the utilities `modality.ts`, `glide.ts`, `truncate.ts`, `paint.ts`, and the shared recipes `control.ts`, `popup.ts`, `option.ts`. |
| `spec/` | The sources of the look: `tokens.json`, `icons.json`, and the JSON schemas (`schema/`). Field reference: `spec/README.md`. |
| `packages/core` | Generated from `spec/`: the stylesheet (`css/`) and the token and icon tables. `css/base.css` is hand-written. |
| `packages/cli` | The tool users run: `init`, `search`, `docs`, `add`, `remove`, `check`, `status`, `update`, `mcp`. `src/rules.js` holds the rules of `check`; the validator here applies the same ones to the library. |
| `packages/react`, `vue`, `svelte` | One generated file each: an index of the adapters, so examples, docs and tests can import `@fndn/react`, `@fndn/vue`, `@fndn/svelte`. |
| `showcases/` | Whole apps built from the components (a code editor, a web app, a browser). |
| `skill/fndn/SKILL.md` | The skill `init` gives a user's agent. `skill/fndn/evals/` are test tasks for it. |
| `docs/` | The rule books, which the tool serves to users (`docs design`, `docs motion` …): `DESIGN.md`, `design/motion.md`, `design/interaction.md`, `design/accessibility.md`, `authoring.md`, `porting.md`. For this repository only: `examples-guide.md` (how examples are written). |
| `apps/docs` | The docs site (Astro). Its dev server also serves the bare page the browser tests drive (`src/harness`, at `/harness.html`). |
| `scripts/` | `build-*.mjs`, `validate.mjs`, and `qa/` (the test runner, the same-DOM check, the worst-case sweep). |

A project gets the same shape: `add` writes `<ui folder>/<name>/` (the adapter of its framework,
the recipe, the logic, and a generated `index.ts`) and `<ui folder>/lib/`, with the same relative
imports. So a file here is, byte for byte, the file in a user's project.

## Read before you change something

- `docs/authoring.md`: how a component is built (shape, sizes and looks, state, motion vocabulary,
  the checklist; its last section is about this repository).
- `docs/DESIGN.md` and `docs/design/*.md`: the design rules, each with its reason. They describe
  what is built: where a rule book and the components disagree, find out which is wrong and fix
  it. A new rule goes into the rule book that carries it, with its reason, and into
  `.claude/skills/house-rules/SKILL.md` when it sharpens or overrides a general design skill.
- "Decided, though it may look wrong", below: the choices that an outsider would be tempted to
  undo. Ask before going against one.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm check` | Everything: build, every typecheck, the tool's tests. |
| `pnpm build` | Tokens and icons → the three package indexes → validate → the tool's data (`packages/cli/data/`). |
| `pnpm validate` | Spec ↔ recipe ↔ three adapters, `dependencies` ↔ imports, the composition lint, and the rules of `check` over recipes, adapters and examples. `node scripts/validate.mjs <name…>` for a few. |
| `pnpm build:indexes` | After adding a component or an adapter file, or changing what an adapter exports. |
| `pnpm build:tokens` | After editing `spec/tokens.json` or `spec/icons.json`. |
| `pnpm typecheck` | Every package; `pnpm --filter @fndn/components typecheck` checks the components in React, Vue and Svelte. |
| `pnpm test` | The tool's tests (`packages/cli/test/`). |
| `pnpm fndn <command>` | The tool, from this repository. In another folder: `node <repo>/packages/cli/bin/fndn.js`. |
| `node scripts/qa/run.mjs [--fast] [--all] [--jobs 4] [names]` | The browser tests of those components in the three frameworks: same DOM, keyboard and pointer, worst-case data. `--fast` is React only. The full suite takes 10 to 35 minutes. |
| `node scripts/qa/docs.mjs` | The smoke test of the docs site. Every browser test reaches the docs dev server at `DOCS_URL` (default `http://localhost:4321`); the smoke test alone also runs against a built preview. |
| `pnpm docs` | The docs site on :4321, and with it the test page: `/harness.html?c=<name>&fw=react&ex=0` (`&theme=dark`, `&dir=rtl`, `&data=worst`). |

## Rules

- **The spec is the contract, and generated files are never edited by hand**: `components/lib/tv.ts`,
  `packages/core/css/tokens.css`, `tailwind.css`, `index.css`, `packages/core/src/tokens.ts`,
  `icons.ts`, and `packages/{react,vue,svelte}/src/index.ts`. Nothing else is generated: there are
  no copies of a recipe or a helper anywhere.
- **A component ships whole**, in its folder: spec, recipe, React, Vue and Svelte adapters that
  render the same DOM, fixtures, its test and examples.
- **One component, one folder; what is shared, in `lib/`.** A file that only one component needs
  lives in that component's folder; another component that needs it imports it from there. A file
  moves to `lib/` when it belongs to no component in particular.
- **Styling is the recipe.** Every part carries `data-slot="<name>-<part>"`. State the behaviour
  engine owns stays in its attributes and is styled with Tailwind variants. Hand-written CSS is
  only what Tailwind cannot say (keyframes, a few structural selectors), in `base.css`.
- **Behaviour is Ark UI** (Zag.js) in every framework for anything interactive. Do not hand-roll
  focus management, and do not switch to per-framework libraries.
- **Icons are Phosphor**, through the official packages, each listed in `spec/icons.json`.
- **The library passes its own check.** What `packages/cli/src/rules.js` reports in a user's
  project, `pnpm validate` reports here. Change a rule and the library must still pass it.
- **These files are read in other people's projects.** A comment says what the code does and why,
  for a reader who has never seen this repository: no history, no dates, no task numbers, no names.
- **Clean over clever.** Remove what a change makes dead. No planning or status documents, and
  no log of who decided what: the code and `docs/` are the record.
- pnpm 11: build-script approvals live in `pnpm-workspace.yaml` (`allowBuilds`).
- Commit, push or open a pull request only when the person you work for asks, and never on the
  default branch. `pnpm check` passes before anything is proposed.
- Ask when unsure. A question costs less than a wrong guess, above all for anything that changes
  the look of a component or its contract.

## Design work

The design skills in `.claude/skills/` are mandatory for anything that is designed (a component, a
part, a variant, motion, an example, a screen): `.claude/skills/house-rules/SKILL.md` first (the
project's own design rules; they override the general skills where the two differ), then
`emil-design-eng` and the skill that fits (`animate`, `choreograph`, `gestures`, `mobile-native`,
`animation-performance`); before calling it done, `review-animations/STANDARDS.md` and
`break-ui`. Anything bigger than one component also goes through `screen-review`, and a review
by someone who did not build it. `house-rules` and `screen-review` are this project's; the
others are third-party (MIT, see `NOTICE`), pinned in `skills-lock.json`.

Look at what you made, at 125% display scaling as well as 100%: fractional scaling is where
hairlines, alignment and flicker go wrong. Take screenshots through `scripts/qa/cdp.mjs`
(`launch({ dpr: 1.25 })`), light, dark, 390px wide, right-to-left, and check motion and keyboard
behaviour by driving the page, not by reading the code. Never start a browser any other way, and
leave none running.

## Decided, though it may look wrong

- The prompt bar's `/` and `@` suggestion lists run on `prompt-bar/prompt-suggest.ts`, not on the
  combobox: the combobox machine needs an input that holds the query, and here the query is a word
  inside a multi-line textarea. Focus never leaves the textarea.
- Agent components are controlled (`working`, `rows`, `status` are props). The host wires them to
  real events; nothing plays a scripted timeline.
- Nothing animates because it mounted. The code that adds an item while the user watches sets
  `appear`; a component cannot tell a new item from a restored one.
- Right-to-left comes from Ark's `LocaleProvider` once at the app's root, and from logical
  properties in the recipes. Components take no `dir` prop.
- The carousel moves on its own code (`carousel/carousel.logic.ts`): one spring for every page
  change and drag release, the mouse drag, the effects drawn from the scroll position, the page
  named wherever the slides come to rest, and the endless strip (no slide is copied: each is
  drawn on the turn of the strip nearest the scroller). The engine keeps the pages, the keyboard
  and the ARIA. Its mouse drag and the browser's smooth scroll were tried and are not smooth, CSS
  scroll-driven effects do not run in every browser, and its own watch on wheel and touch (which
  names the page from its measure of the slides) is left out of the slide group, which the
  adapters render themselves from the engine's props.
- An app's shape is CSS, not a provider. Buttons, toggles and segmented controls read the
  `radius.shape` tokens; a project sets `"shape": "rounded"` in its `fndn.json` and the tool writes
  the tokens into `styles/config.css`. Here, where three apps of different shapes share one site,
  a showcase says its shape in its `index.json` and its page carries `data-shape` (the same
  switch, for a part of a page). Components that render Buttons take no `shape` prop to pass on.
- An example the adapters cannot render from JSON props is marked `"frameworks": false` in its
  fixtures; the same-DOM check and the worst-case sweep skip it.

## Working with several agents

One working tree and one dev server are shared by everything that runs here.

- Give each delegated agent a narrow brief and the files it owns; two agents never edit the same
  file, and a delegated agent does not start agents of its own. Make small changes directly.
- A save anywhere reloads the pages a browser test is driving. A browser check that fails and
  then passes on a rerun was a reload: rerun once before believing a failure, and do not edit
  files while the full suite runs.
- Run the full browser suite once per wave of work, not per change.
- Never start, stop or restart the dev server from a delegated agent. It reloads its own config,
  and the site's plugins with it, when `apps/docs/astro.config.mjs` is saved. No polling loops.
