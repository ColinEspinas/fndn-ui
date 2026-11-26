# fndn/ui

A UI toolkit built for AI agents first: 91 components for **React, Vue and Svelte** that an agent
adds to a project as source files, with the rules that keep what it builds as good as the
components themselves.

- **One contract, three frameworks.** A component is a JSON spec, one Tailwind recipe
  (tailwind-variants) and a thin adapter per framework. The three adapters render the same DOM, so
  a screen looks and moves the same whichever you use. Behaviour (keyboard, focus, ARIA) is
  Ark UI; icons are Phosphor.
- **One tool.** `fndn` is a command line and an MCP server in one package, with the components
  inside it. It finds a component for a need, prints its contract and examples for your
  framework, writes it into your project, and keeps it up to date without touching what you
  changed.
- **A check, not a hope.** `fndn check` reads your code and reports what breaks the system's rules
  (a colour that is not a token, motion outside the motion utilities, an icon-only button without
  a name), each with its reason and the fix. The library's own source passes the same check.
- **Built to be extended.** The rule books (design, motion, interaction, accessibility, how a
  component is built) ship with the tool, so an agent builds what is missing the way the system
  builds its own, and the check holds it to the same standard.

> The package is not published yet. Until it is,
> run the tool from a checkout, after `pnpm install && pnpm build` here: wherever this page says
> `npx fndn`, write `node <path to this repository>/packages/cli/bin/fndn.js` (for the MCP
> server: `"command": "node", "args": ["<path>/packages/cli/bin/fndn.js", "mcp"]`).

## Use it in a project

The project needs React, Vue 3 or Svelte 5, and Tailwind 4.

```bash
npx fndn init                    # fndn.json, the stylesheet, the fonts, the agent skill
npx fndn search "pick a date"    # the components that answer a need
npx fndn docs date-picker        # its contract and examples, in your framework
npx fndn add date-picker button  # the files, and everything they import
npx fndn check                   # what breaks the rules, with the fix
```

```tsx
import { Button } from "@/components/ui/button";

<Button variant="primary">Save changes</Button>
```

Each component gets a folder of its own (`src/components/ui/button/`; Svelte:
`src/lib/components/ui/button/`), next to `lib/` for what components share, and is imported from
that folder in every framework. The files are yours to edit: `status` shows what you changed and what the library has
improved since, `update` never overwrites your changes, and `remove` deletes a component with
what only it needed. Dark mode is `data-theme="dark"` (or `class="dark"`) on `<html>`. The project's settings are in
`fndn.json`: `"shape": "rounded"` turns the pill buttons, toggles and segmented controls into
rounded ones, app-wide (`init --shape rounded`, or edit it and run `update`).

### With an agent

`init` writes a skill into `.claude/skills/fndn/` that tells a coding agent how to build with the
system. The same package is an MCP server with the tools `search`, `docs`, `add`, `check`,
`status` and `init`:

```json
{ "mcpServers": { "fndn": { "command": "npx", "args": ["-y", "fndn", "mcp"] } } }
```

`docs` also takes a topic: `design`, `motion`, `interaction`, `accessibility`, `authoring`,
`porting`, `rules`, `tokens`, `icons`, `install`.

## This repository

```bash
pnpm install
pnpm check           # build, validation, every typecheck, the tool's tests
pnpm docs            # the docs site on http://localhost:4321
pnpm fndn search     # the tool, from here
```

[`AGENTS.md`](AGENTS.md) is the guide to working here, for a person or a coding agent: the map
of the repository, every command and the rules. [`CONTRIBUTING.md`](CONTRIBUTING.md) says how to
set up and propose a change.

## License

MIT. The design language is derived from Beautiful UI by Turbo (MIT), and the general design
skills in `.claude/skills/` are by Emil Kowalski (MIT); see `NOTICE`.
