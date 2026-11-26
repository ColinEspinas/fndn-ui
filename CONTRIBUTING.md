# Contributing to fndn/ui

Thank you for wanting to improve it. This page says how to set the repository up and what a change
has to keep true. [`AGENTS.md`](AGENTS.md) is the full guide (the map of the repository, every
command, the rules); it is written for coding agents and reads just as well for people.

## Set up

You need Node 20 or later, pnpm 11, and, for the browser tests, Chromium
(`npx playwright install chromium`, or point `CHROME_BIN` at a Chrome or Chromium you have).

```bash
pnpm install
pnpm build           # tokens and icons, the package indexes, validation, the tool's data
pnpm docs            # the docs site on http://localhost:4321, and the page the browser tests drive
```

## Before you propose a change

```bash
pnpm check                              # build, validation, every typecheck, the tool's tests
node scripts/qa/run.mjs button dialog   # the browser tests of the components you touched
node scripts/qa/run.mjs --all           # all of them (10 to 35 minutes)
```

The browser tests need `pnpm docs` running. They compare the React, Vue and Svelte renderings of
every example, drive keyboard and pointer, and sweep worst-case data in both directions and both
themes.

## What a change must keep

- **The spec is the contract.** A component is its spec (`components/<name>/<name>.json`), one
  recipe, and three adapters that render the same DOM. A change to one framework is a change to
  all three.
- **A component ships whole**: spec, recipe, adapters, fixtures, test and examples, in its folder.
  [`docs/authoring.md`](docs/authoring.md) is the walkthrough and the checklist.
- **The library passes its own check.** What `fndn check` reports in a user's project,
  `pnpm validate` reports here.
- **Generated files are not edited by hand**; `AGENTS.md` lists them.
- **Comments say what the code does and why**, for a reader in another project: the files here
  are copied into users' projects as they are.

## Design changes

The design rules are in [`docs/DESIGN.md`](docs/DESIGN.md) and `docs/design/`, each with its
reason. A change that goes against one changes the rule too, in the same pull request, and says
why. Look at what you made at 100% and 125% display scaling, in light and dark, at 390px wide and
right-to-left, and attach before and after screenshots.

## Working with a coding agent

The repository is set up for it: `AGENTS.md` is read at the start of a task (`CLAUDE.md` points
to it), and `.claude/skills/` holds the design skills, of which `house-rules` and `screen-review`
are this project's own. The same rules apply to an agent's change as to a person's.

## Pull requests

One topic per pull request, with what changed and why. For anything visible, screenshots; for
behaviour, the test that covers it.

## License

fndn/ui is MIT licensed. By contributing you agree that your contribution is under the same
license.
