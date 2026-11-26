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

A component is its spec, one recipe and three adapters that render the same DOM, and it ships
whole: a change to one framework is a change to all three. [`AGENTS.md`](AGENTS.md) has the full
list of rules (Rules), and [`docs/authoring.md`](docs/authoring.md) the walkthrough and the
checklist for a component.

A change to how something looks or moves follows the design rules in
[`docs/DESIGN.md`](docs/DESIGN.md) and `docs/design/`; one that goes against a rule changes the
rule too, in the same pull request, and says why. `AGENTS.md` (Design work) says how to look at
the result and under which conditions; attach before and after screenshots.

## Working with a coding agent

The repository is set up for it: `AGENTS.md` is read at the start of a task (`CLAUDE.md` points
to it), and `.claude/skills/` holds the design skills. The same rules apply to an agent's change
as to a person's.

## Pull requests

One topic per pull request, with what changed and why. Commit messages follow Conventional
Commits (`fix(carousel): …`, `docs: …`; `AGENTS.md`, Rules). For anything visible, screenshots; for
behaviour, the test that covers it.

## License

fndn/ui is MIT licensed. By contributing you agree that your contribution is under the same
license.
