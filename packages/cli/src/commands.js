// The commands, as functions from arguments to text. The command line (bin/fndn.js) and the MCP
// server (mcp.js) both call these, so an agent gets the same answer either way.
import path from "node:path";
import { add, init, remove, status, update, UsageError } from "./add.js";
import { check, report } from "./check.js";
import { docs, find } from "./docs.js";
import { catalog, CATEGORIES } from "./catalog.js";
import { COMMAND } from "./render.js";
import { FRAMEWORKS, openProject } from "./project.js";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** What a write did, file by file. */
function written(project, w) {
  const out = [];
  const list = (label, files) => { if (files.length) out.push(`${label}: ${files.map((f) => project.rel(f)).join(", ")}`); };
  list("Created", w.created);
  list("Updated", w.updated);
  if (w.kept.length) out.push(`Already current: ${plural(w.kept.length, "file")}`);
  if (w.skipped.length) out.push(`Left alone, because the project has changed them: ${w.skipped.map((f) => project.rel(f)).join(", ")}. To take the library's version anyway: add --overwrite (your changes to those files are lost).`);
  return out;
}

/** How app code imports from the library's folder: the project's alias or, without one, the path
 * as a file at the top of src/ writes it. */
const importBase = (project) => project.config.import ?? `./${project.config.dir.replace(/^src\//, "")}`;

/** The import of a component: from its folder, in every framework. */
function importLine(project, name) {
  const Pascal = name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
  return `import { ${Pascal} } from "${importBase(project)}/${name}";`;
}

export const commands = {
  init(cwd, { framework, dir, skill = true, fonts = true, shape } = {}) {
    const r = init(cwd, { framework, dir, skill, fonts, shape });
    const { config, root } = r.project;
    return [
      r.created ? `Set up for ${config.framework} in ${path.relative(process.cwd(), root) || "."}: the library lives in ${config.dir}/. Wrote fndn.json (the framework, that folder, and a record of what the tool writes).` : `Already set up (${config.framework}, ${config.dir}/); brought up to date.`,
      ...written(r.project, r.written),
      ...r.notes,
      config.import ? `Components are imported from "${config.import}/…".` : `The project has no import alias for ${config.dir}/ (none in tsconfig "paths"): import the components by relative path, as in ${importLine(r.project, "button")}`,
      `The app's shape is "${config.shape ?? "pill"}" (fndn.json "shape": pill or rounded; \`${COMMAND} init --shape rounded\` or edit it and run \`${COMMAND} update\`).`,
      r.install ? `Install what the components need: ${r.install}` : "Nothing to install yet: `add` names the packages each component needs.",
      `Next: ${COMMAND} search, then ${COMMAND} add <name>.`,
    ].filter(Boolean).join("\n");
  },

  search(cwd, { query = "", category } = {}) {
    if (category && !CATEGORIES.some(([id]) => id === category)) throw new UsageError(`Unknown category "${category}". Categories: ${CATEGORIES.map(([id]) => id).join(", ")}.`);
    return find(query, { category, framework: openProject(cwd)?.config.framework });
  },

  docs(cwd, { name, framework, examples = true, example } = {}) {
    const project = openProject(cwd);
    if (framework && !FRAMEWORKS.includes(framework)) throw new UsageError(`Unknown framework "${framework}": ${FRAMEWORKS.join(", ")}.`);
    /* true: the first two in full; "all"; false: titles only */
    const limit = examples === "all" ? Infinity : examples === false || examples === "none" ? 0 : 2;
    return docs(name, { framework: framework ?? project?.config.framework, base: project ? importBase(project) : undefined, examples: limit, example });
  },

  add(cwd, { names = [], overwrite = false, dryRun = false } = {}) {
    if (!names.length) throw new UsageError(`Name the components to add: ${COMMAND} add button select. See what exists: ${COMMAND} search`);
    const r = add(cwd, names, { overwrite, dryRun });
    return [
      dryRun ? "Dry run: nothing written." : "",
      ...written(r.project, r.written),
      r.included.length ? `Came along, because ${names.length > 1 ? "they are" : "it is"} built from them: ${r.included.join(", ")}.` : "",
      r.install ? `Install what these files import: ${r.install}` : "Nothing to install: the project already has the packages these files import.",
      `Use: ${importLine(r.project, names[0])}`,
      `Before you call the work done: ${COMMAND} check`,
    ].filter(Boolean).join("\n");
  },

  remove(cwd, { names = [] } = {}) {
    if (!names.length) throw new UsageError(`Name the components to remove: ${COMMAND} remove select`);
    const r = remove(cwd, names);
    const list = (files) => files.map((f) => r.project.rel(f)).join(", ");
    const why = ({ components, files }) => [
      components.length ? `${components.join(", ")} ${components.length > 1 ? "are" : "is"} built from it` : "",
      files.length ? `${files.join(", ")} ${files.length > 1 ? "import" : "imports"} it` : "",
    ].filter(Boolean).join(", and ");
    return [
      r.removed.length ? `Removed: ${list(r.removed)}` : "",
      r.also.length ? `Gone as well, since nothing else is built from ${r.also.length > 1 ? "them" : "it"}: ${r.also.join(", ")}. If your own code imports ${r.also.length > 1 ? "one" : "it"}, add it back: ${COMMAND} add ${r.also[0]}` : "",
      ...r.stays.map((s) => `${s.name} stays: ${why(s)}.${names.includes(s.name) && s.files.length && !s.components.length ? " To remove it, take it out of there first." : ""}`),
      r.left.length ? `Left in place, because the project has changed ${r.left.length > 1 ? "them" : "it"}: ${list(r.left)}. The tool no longer tracks ${r.left.length > 1 ? "them" : "it"}: keep or delete by hand.` : "",
      r.unused.length ? `No component imports ${r.unused.join(", ")} any more: uninstall ${r.unused.length > 1 ? "them" : "it"} if the project's own code does not either.` : "",
    ].filter(Boolean).join("\n") || `Dropped ${names.join(", ")} from fndn.json; no file was left to delete.`;
  },

  check(cwd, { paths = [], json = false } = {}) {
    const result = check(cwd, paths);
    const failed = result.findings.some((f) => !f.advice);
    return { text: json ? JSON.stringify(result, null, 2) : report(result), failed };
  },

  status(cwd) {
    const s = status(cwd);
    const { config } = s.project;
    const list = (label, files) => (files.length ? `${label}: ${files.map((f) => s.project.rel(f)).join(", ")}` : "");
    return [
      `${config.framework}, library ${catalog().version}, in ${config.dir}/`,
      `Components: ${config.components.length ? config.components.join(", ") : "none yet"}`,
      s.included.length ? `With them, because they are built from them: ${s.included.join(", ")}` : "",
      list("Changed by the project (yours now; update leaves them alone)", s.modified),
      list(`Missing (restore: ${COMMAND} update; drop the component: ${COMMAND} remove <name>)`, s.missing),
      s.outdated.length ? `${list("Behind the library", s.outdated)}. Bring them up to date: ${COMMAND} update` : "Everything the tool wrote is current.",
      s.install ? `Not installed yet, and imported by the components: ${s.install}` : "",
    ].filter(Boolean).join("\n");
  },

  update(cwd, { overwrite = false } = {}) {
    /* with no component yet there is still the stylesheet, which carries the settings of fndn.json */
    const r = update(cwd, { overwrite });
    const lines = [...written(r.project, r.written), r.install ? `Install what these files import: ${r.install}` : ""].filter(Boolean);
    if (!r.project.config.components.length) lines.push("No components added yet.");
    return lines.join("\n");
  },
};
