#!/usr/bin/env node
// The `fndn` command line. Each command is a function in src/commands.js; this file only reads the
// arguments and prints.
import path from "node:path";
import { commands } from "../src/commands.js";
import { UsageError } from "../src/add.js";
import { serve } from "../src/mcp.js";

const HELP = `fndn: the component system's tool. The components are inside it.

  fndn init [--framework react|vue|svelte] [--dir <folder>] [--shape pill|rounded] [--no-skill] [--no-fonts]
                               set a project up, once
  fndn search [words…] [--category <id>]
                               the components that answer a need; all of them without words
  fndn docs [name|topic] [--framework <fw>] [--all-examples | --no-examples | --example <id>]
                               a component's contract and its first examples (--example: one
                               example alone, by the id the page lists); topics: design, motion,
                               interaction, accessibility, authoring, porting, rules, tokens,
                               icons, install
  fndn add <name…> [--overwrite] [--dry-run]
                               write components, and what they import, into the project
  fndn remove <name…>            delete components, and what only they needed; a file the
                               project changed is left in place
  fndn check [paths…] [--json]   report what breaks the system's rules
  fndn status                    what the project has, changed, and could update
  fndn update [--overwrite]      bring the added components up to the library's current files
  fndn mcp [project folder]      serve these commands as MCP tools over stdio (the folder the
                               server works in: where it was started, unless one is given)
`;

/** `--flag`, `--flag value` and `--no-flag` into options; everything else is a positional. */
function parse(argv, valued) {
  const options = {}, rest = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) { rest.push(arg); continue; }
    const name = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (valued.includes(name)) options[name] = argv[++i];
    else if (name.startsWith("no")) options[name[2].toLowerCase() + name.slice(3)] = false;
    else options[name] = true;
  }
  return { options, rest };
}

const [command, ...argv] = process.argv.slice(2);
const { options, rest } = parse(argv, ["framework", "dir", "shape", "category", "example"]);
const cwd = process.cwd();

try {
  switch (command) {
    case "init": console.log(commands.init(cwd, options)); break;
    case "search": case "list": console.log(commands.search(cwd, { query: rest.join(" "), category: options.category })); break;
    case "docs": console.log(commands.docs(cwd, { name: rest[0], framework: options.framework, examples: options.allExamples ? "all" : options.examples, example: options.example })); break;
    case "add": console.log(commands.add(cwd, { names: rest, overwrite: options.overwrite, dryRun: options.dryRun })); break;
    case "remove": console.log(commands.remove(cwd, { names: rest })); break;
    case "check": { const r = commands.check(cwd, { paths: rest, json: options.json }); console.log(r.text); process.exitCode = r.failed ? 1 : 0; break; }
    case "status": console.log(commands.status(cwd)); break;
    case "update": console.log(commands.update(cwd, options)); break;
    case "mcp": serve(rest[0] ? path.resolve(rest[0]) : cwd); break;
    case undefined: case "help": case "--help": case "-h": console.log(HELP); break;
    default: throw new UsageError(`Unknown command "${command}".\n\n${HELP}`);
  }
} catch (error) {
  if (!(error instanceof UsageError)) throw error;
  console.error(error.message);
  process.exitCode = 2;
}
