// The documentation as Markdown, for agents. One generator serves the tool (`fndn docs <name>`, the
// MCP server's `docs` tool) and the docs site's Markdown endpoints (/llms.txt, /components/<name>.md).
// Pure: no fs. The caller gathers the sources and says how a page links to another one (`href`: a
// URL on the site, or null for no link).
//
//   const docs = agentDocs(sources);
//   docs.pages                  [{ path: "/components/button.md", title, group, summary }]
//   docs.render(path, href)     the Markdown of one page
//   docs.llmsTxt(href)          the index        docs.llmsFull(href)   every page in one file

import { toProjectImports } from "./imports.js";

/** How the tool is run. The one place its name is written. */
export const COMMAND = "npx fndn";
export const FRAMEWORKS = ["react", "vue", "svelte"];
const FW_LABEL = { react: "React", vue: "Vue", svelte: "Svelte" };
const FENCE = { react: "tsx", vue: "vue", svelte: "svelte" };
const EXT = { react: "tsx", vue: "vue", svelte: "svelte" };
/* catalogue order (as scripts/lib.mjs and the docs' lib/types.ts) */
const CATEGORIES = [["actions", "Actions"], ["inputs", "Inputs"], ["overlays", "Overlays"], ["navigation", "Navigation"], ["display", "Display"], ["feedback", "Feedback"], ["agent", "Agent"], ["data", "Data"]];
/* the docs' foundations pages and the token groups each one shows */
export const FOUNDATIONS = [
  ["colour", "Colour", ["color"]],
  ["type", "Type", ["font", "text"]],
  ["elevation", "Elevation", ["shadow", "z"]],
  ["shape", "Shape", ["radius"]],
  ["motion", "Motion", ["duration", "easing", "$transitions", "motion"]],
  ["icons", "Icons", []],
  ["spacing", "Spacing", ["space"]],
];
export const SUMMARY =
  "A spec-first component system, in the spirit of shadcn, for React, Vue and Svelte. Each component is one JSON spec (the contract: parts, props, states, tokens, accessibility, motion), a Tailwind recipe written with tailwind-variants, and thin adapters for React, Vue and Svelte that render the same markup, with Ark UI (Zag.js) for behaviour and Phosphor for icons. Components are copied into your project as files you own, by the system's own tool: a command line that is also an MCP server, with a check that holds your code to the rules the components follow.";

export const pascal = (k) => k.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const camel = (k) => k.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const firstSentence = (s = "") => { const m = s.match(/^.*?[.!?](\s|$)/); return (m ? m[0] : s).trim(); };
export const installCommand = (name) => `${COMMAND} add ${name}`;
/* how app code imports from the library's folder: the project's alias when the caller knows it */
const importBase = (fw) => (fw === "svelte" ? "$lib/components/ui" : "@/components/ui");
const importPath = (fw, name, base = importBase(fw)) => `${base}/${name}`;
const adapterFile = (fw, name) => (fw === "react" ? `${name}.tsx` : `${pascal(name)}.${fw}`);
const targetsOf = (spec) => spec.targets ?? FRAMEWORKS;

/* Markdown helpers */
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
const table = (head, rows) => (rows.length ? [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.map(cell).join(" | ")} |`)].join("\n") : "");
const code = (lang, text) => { const t = String(text).replace(/\n+$/, ""); const f = t.includes("```") ? "````" : "```"; return `${f}${lang}\n${t}\n${f}`; };
const bullets = (list) => (list ?? []).map((x) => `- ${x}`).join("\n");
const section = (title, body) => (body && body.trim() ? `## ${title}\n\n${body.trim()}` : "");
const join = (...blocks) => blocks.filter((b) => b && b.trim()).map((b) => b.replace(/^\n+|\s+$/g, "")).join("\n\n") + "\n";

/** A prop's type, written as TypeScript. */
function propType(p) {
  if (p.ts) return p.ts;
  if (p.type === "enum") return (p.values ?? []).map((v) => `"${v}"`).join(" | ");
  if (p.type === "array" && typeof p.items === "string") return `${p.items}[]`;
  if (p.type === "array" && p.items && typeof p.items === "object") {
    /* a JSON-schema item ({ "type": "string" }) is a list of that type, not an object with a `type` field */
    if (typeof p.items.type === "string" && Object.keys(p.items).every((k) => ["type", "description", "enum"].includes(k))) return `${p.items.enum ? p.items.enum.map((v) => `"${v}"`).join(" | ") : p.items.type}[]`.replace(/^(.+\|.+)\[\]$/, "($1)[]");
    const keys = Object.keys(p.items);
    if (keys.length && keys.every((k) => /^\d+$/.test(k))) return `${p.items[keys[0]]}[]`;
    return `{ ${Object.entries(p.items).map(([k, v]) => { const opt = /\?$/.test(String(v)); return `${k}${opt ? "?" : ""}: ${String(v).replace(/\?$/, "")}`; }).join("; ")} }[]`;
  }
  if (p.type === "node") return "node (children / slot)";
  return p.type;
}

/* ── tokens ─────────────────────────────────────────────────────────────────── */
function tokenValue(group, v) {
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) {
    if (group === "easing") return `cubic-bezier(${v.join(", ")})`;
    if (v.length && typeof v[0] === "object") return v.map((l) => `${l.inset ? "inset " : ""}${l.x} ${l.y} ${l.blur} ${l.spread} ${l.color}`).join(", ");
    return v.join(", ");
  }
  return String(v);
}
const cssVar = (prefix, g, n) => (g === "color" ? `--${prefix}-${n}` : `--${prefix}-${g}-${n}`);
const UTIL = {
  color: (n) => `bg-${n} text-${n} border-${n}`, shadow: (n) => `shadow-${n}`, radius: (n) => `rounded-${n}`, text: (n) => `text-${n}`,
  font: (n) => `font-${n}`, easing: (n) => `ease-${n}`, duration: (n) => `duration-${n} delay-${n}`, z: (n) => `z-${n}`,
  motion: (n) => ({ "press-scale": "scale-press squeeze-press", "press-scale-sm": "scale-press-sm squeeze-press-sm", "popup-scale": "scale-popup squeeze-popup" })[n] ?? "",
  space: () => "",
};
const GROUP_TITLE = { color: "Colours", font: "Fonts", text: "Type scale", shadow: "Shadows", z: "Stacking", radius: "Radii", duration: "Durations", easing: "Easings", $transitions: "Timings", motion: "Motion quantities", space: "Spacing" };

function tokenGroup(tokens, g) {
  const group = tokens[g];
  if (!group || typeof group !== "object") return "";
  const prefix = tokens.prefix ?? "fndn";
  const entries = Object.entries(group).filter(([k]) => !k.startsWith("$"));
  const intro = group.$description ?? "";
  if (g === "$transitions") {
    const rows = entries.map(([n, [d, e]]) => [`\`${n}\``, `duration.${d}`, tokens.easing?.[e] ? `easing.${e}` : e, MOTION_UTIL.map((w) => `motion-${w}-${n}`).slice(0, 2).join(", ") + ", …"]);
    return join(`### ${GROUP_TITLE[g]}`, intro, `The utilities are \`motion-<what>-<timing>\`, with \`<what>\` one of ${MOTION_UTIL.map((w) => `\`${w}\``).join(", ")}; \`motion-also-[<property> var(--${prefix}-duration-…) var(--${prefix}-easing-…)]\` adds any other property.`, table(["Timing", "Duration", "Easing", "Utilities"], rows));
  }
  const themed = entries.some(([, t]) => t.$value && typeof t.$value === "object" && !Array.isArray(t.$value) && "light" in t.$value);
  const reduced = entries.some(([, t]) => t.$reducedMotion !== undefined);
  const head = ["Token", "CSS variable", ...(UTIL[g] && g !== "space" ? ["Utility"] : []), ...(themed ? ["Light", "Dark"] : ["Value"]), ...(reduced ? ["Reduced motion"] : []), "Description"];
  const rows = entries.map(([n, t]) => {
    const v = t.$value;
    const vals = themed ? (v && typeof v === "object" && !Array.isArray(v) && "light" in v ? [tokenValue(g, v.light), tokenValue(g, v.dark)] : [tokenValue(g, v), tokenValue(g, v)]) : [tokenValue(g, v)];
    return [`\`${g}.${n}\``, `\`${cssVar(prefix, g, n)}\``, ...(UTIL[g] && g !== "space" ? [UTIL[g](n) ? `\`${UTIL[g](n).split(" ").join("` `")}\`` : ""] : []), ...vals.map((x) => (x ? `\`${x}\`` : "")), ...(reduced ? [t.$reducedMotion !== undefined ? `\`${tokenValue(g, t.$reducedMotion)}\`` : ""] : []), t.$description ?? ""];
  });
  return join(`### ${GROUP_TITLE[g] ?? g}`, intro, table(head, rows));
}
const MOTION_UTIL = ["colors", "opacity", "shadow", "transform", "filter", "size", "radius"];

/* ── guides: links between docs stay docs, links to other files become plain text ── */
function guideLinks(markdown, id, href) {
  return markdown.replace(/(?<!!)\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, text, to) => {
    if (/^(https?:|mailto:|#)/.test(to)) return whole;
    const url = new URL(to, `https://repo.invalid/docs/${id}.md`);
    const m = url.pathname.match(/^\/docs\/([\w/-]+)\.md$/);
    const h = m ? href(`/guides/${m[1]}.md`) : null;
    return h ? `[${text}](${h}${url.hash})` : text;
  });
}

/* ── the generator ─────────────────────────────────────────────────────────── */
/**
 * sources: {
 *   specs: component specs (the contract, spec/components/*.json)
 *   tokens: spec/tokens.json, icons: spec/icons.json
 *   guides: [{ id: "design/motion", title, markdown }] (docs/**.md, in the docs' order)
 *   examples: { <name>: { index: examples/<name>/index.json, files: { "primary.tsx": source } } }
 *   recipes: { <name>: source of the recipe (<name>.recipe.ts) }
 *   exports: { <framework>: { <exported name>: <component> } } (imports.js, exportTable)
 * }
 */
export function agentDocs(src) {
  const specs = [...src.specs].sort((a, b) => {
    const rank = (s) => { const i = CATEGORIES.findIndex(([c]) => c === s.category); return i < 0 ? 99 : i; };
    return rank(a) - rank(b) || (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name);
  });
  const specOf = (n) => specs.find((s) => s.name === n);
  const guides = src.guides ?? [];
  const groupDesc = (g) => src.tokens?.[g]?.$description ?? "";

  const pages = [
    { path: "/index.md", title: "Overview", group: "Overview", summary: "What the system is, and every component and block." },
    { path: "/installation.md", title: "Installation", group: "Overview", summary: "Set a project up once, add components, check the result; the same tool as an MCP server." },
    ...FOUNDATIONS.map(([id, title, groups]) => ({ path: `/foundations/${id}.md`, title, group: "Foundations", summary: id === "icons" ? "The icon vocabulary: Phosphor icons, by name." : id === "spacing" ? "A 4px grid." : firstSentence(groupDesc(groups[0])) })),
    ...specs.filter((s) => s.kind !== "block").map((s) => ({ path: `/components/${s.name}.md`, title: s.title, group: "Components", category: s.category, summary: s.summary ?? firstSentence(s.description) })),
    ...specs.filter((s) => s.kind === "block").map((s) => ({ path: `/components/${s.name}.md`, title: s.title, group: "Blocks", category: s.category, summary: s.summary ?? firstSentence(s.description) })),
    ...guides.map((g) => ({ path: `/guides/${g.id}.md`, title: g.title, group: "Guides", summary: firstSentence(g.markdown.replace(/```[\s\S]*?```/g, "").split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !/^[#|>*`<-]|^\d+\./.test(p) && !/:$/.test(p))?.replace(/\s*\n\s*/g, " ") ?? "") })),
  ];

  const linker = (href) => (text, to) => { const h = href(to); return h ? `[${text}](${h})` : text; };

  function overview(href) {
    const a = linker(href);
    const list = (kind) => specs.filter((s) => (s.kind === "block") === (kind === "block")).map((s) => `- ${a(s.title, `/components/${s.name}.md`)}: ${s.summary ?? firstSentence(s.description)}`).join("\n");
    return join(
      "# fndn/ui", SUMMARY,
      `First time? ${a("Installation", "/installation.md")} sets the project up once. Then add a component:`,
      code("bash", installCommand("button")),
      section("Components", `The basic building blocks: one control or one piece of display each.\n\n${list("component")}`),
      section("Blocks", `Built from several components for a product use: agent surfaces, tables, composers.\n\n${list("block")}`),
    );
  }

  /* framework and base: the page as one project reads it (its own framework, its own import paths) */
  function installation(href, { framework = null, base } = {}) {
    const a = linker(href);
    const shown = framework ? [framework] : FRAMEWORKS;
    const vite = {
      react: 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n});',
      vue: 'import { defineConfig } from "vite";\nimport vue from "@vitejs/plugin-vue";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [vue(), tailwindcss()],\n});',
      svelte: 'import { defineConfig } from "vite";\nimport { sveltekit } from "@sveltejs/kit/vite";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [tailwindcss(), sveltekit()],\n});',
    };
    const use = {
      react: ["src/App.tsx", "tsx", (from) => `import { Button } from "${from}";\n\nexport default function App() {\n  return <Button variant="primary">Save changes</Button>;\n}`],
      vue: ["src/App.vue", "vue", (from) => `<script setup lang="ts">\nimport { Button } from "${from}";\n</script>\n\n<template>\n  <Button variant="primary">Save changes</Button>\n</template>`],
      svelte: [framework ? "src/App.svelte" : "src/routes/+page.svelte", "svelte", (from) => `<script lang="ts">\n  import { Button } from "${from}";\n</script>\n\n<Button variant="primary">Save changes</Button>`],
    };
    const per = (f) => shown.map((fw) => `${framework ? "" : `**${FW_LABEL[fw]}**\n\n`}${f(fw)}`).join("\n\n");
    const mcp = JSON.stringify({ mcpServers: { fndn: { command: "npx", args: ["-y", COMMAND.replace(/^npx /, ""), "mcp"] } } }, null, 2);
    return join(
      "# Installation",
      "The system comes with its own tool, `fndn`. It sets a project up, adds components as files the project owns, prints a component's documentation for the project's framework, and checks the code against the rules the components follow. It is a command line and an MCP server in one package, and the components are inside it: adding one downloads nothing. It needs a React, Vue 3 or Svelte 5 project with Tailwind 4.",
      section("1. Tailwind 4", `Every recipe is a list of Tailwind classes, so the project needs Tailwind 4 and its Vite plugin, and a global stylesheet that starts with \`@import "tailwindcss";\`.\n\n${code("bash", "npm install tailwindcss @tailwindcss/vite")}\n\n${per((fw) => `\`vite.config.ts\`\n\n${code("ts", vite[fw])}`)}`),
      section("2. Set the project up", `${code("bash", `${COMMAND} init`)}\n\nIt reads the framework from \`package.json\` (\`--framework\` to say it) and writes:\n\n- \`fndn.json\`: the framework, the app's shape (\`"shape": "pill"\` or \`"rounded"\`), the folder the library lives in (\`src/components/ui\`; Svelte: \`src/lib/components/ui\`; \`--dir\` to choose another) and a hash of every file the tool writes, which is how it tells its files from your changes;\n- \`<folder>/styles/\`: the stylesheet (the tokens for light and dark, the theme that turns them into utilities such as \`bg-surface\`, \`rounded-control\` and \`motion-colors-fast\`, a few global rules), and one line in your global stylesheet that imports it right after Tailwind;\n- the fonts the system is drawn for, Inter and JetBrains Mono: two more import lines (\`@fontsource-variable/inter\`, \`@fontsource-variable/jetbrains-mono\`, which its install line names; \`--no-fonts\` leaves them out and the type falls back to the system font);\n- \`.claude/skills/fndn/\`: the skill that tells a coding agent how to build with the system (\`--no-skill\` leaves it out).\n\nDark mode: the tokens switch under \`class="dark"\` or \`data-theme="dark"\` on an ancestor (usually \`<html>\`); following \`prefers-color-scheme\` is the app's choice. Shape: buttons, toggles and segmented controls are pills; \`"shape": "rounded"\` in \`fndn.json\` (\`${COMMAND} init --shape rounded\`, or edit it and run \`${COMMAND} update\`) gives them a field's corners everywhere, with no prop on each. Right-to-left: set \`dir="rtl"\` on \`<html>\`; the components follow it.`),
      section("3. Add components", `${code("bash", `${COMMAND} add button select dialog`)}\n\nEach component gets a folder of its own in the ui folder: \`button/\` holds \`index.ts\` (what app code imports), the adapter (\`button.tsx\`; Vue: \`Button.vue\`; Svelte: \`Button.svelte\`), \`button.recipe.ts\` (every class of every part) and, when it has some, the logic its adapter needs. Everything those files import comes with them: the components they are built from, and \`lib/\`, what several components share (\`tv.ts\`, tailwind-variants set up for the token classes; the shared recipes \`control.ts\`, \`popup.ts\` and \`option.ts\`; the helpers \`modality.ts\`, \`truncate.ts\`, \`glide.ts\` and \`paint.ts\`). The command ends with the one install line for the npm packages those files need (tailwind-variants, Ark UI, Phosphor).\n\nA component is imported from its folder, the same way in every framework. The files are yours to edit. One you have changed is never overwritten.\n\n${per((fw) => `\`${use[fw][0]}\`\n\n${code(use[fw][1], use[fw][2](importPath(fw, "button", base)))}`)}`),
      section("4. Find and read", `${code("bash", `${COMMAND} search "pick a date"\n${COMMAND} docs date-picker\n${COMMAND} docs design`)}\n\n\`search\` lists the components that answer a need (all of them without a query). \`docs <name>\` prints a component's contract (parts, props, keyboard, motion) and its examples in the project's framework. \`docs\` also takes a topic: \`design\`, \`motion\`, \`interaction\`, \`accessibility\`, \`authoring\` (how to build a new component the way the system builds its own), \`porting\` (a component in another framework), \`rules\`, \`tokens\`, \`icons\`.`),
      section("5. Check", `${code("bash", `${COMMAND} check`)}\n\nReads the project's source and reports what breaks the system's rules: a Tailwind palette colour or a literal colour where a token belongs; Tailwind's own \`transition-*\`, durations, easings and animations where the motion utilities belong; Tailwind's radius and shadow scales; a physical side (\`ml-\`, \`pr-\`, \`left-\`, \`border-l\`, \`rounded-tr\`, \`text-left\`) where the logical one (\`ms-\`, \`pe-\`, \`start-\`, \`border-s\`, \`rounded-se\`, \`text-start\`) keeps right-to-left working; an icon-only button without a name; in hand-written CSS, a hover that is not gated to a real pointer or a literal duration. Run it before a piece of UI is called done. The library's own source passes the same check, so a project that passes is built to the same standard.`),
      section("6. Keep up to date", `${code("bash", `${COMMAND} status\n${COMMAND} update\n${COMMAND} remove select`)}\n\n\`status\` lists the files you have changed and the ones the library has improved since. \`update\` rewrites the files that are still the library's and leaves yours alone. \`remove\` deletes a component and whatever only it needed; a component that another one is built from, or that a component of your own imports, stays, and so does a file you have changed.`),
      section("For agents: the MCP server", `The same package speaks the Model Context Protocol over stdio, with the tools \`search\`, \`docs\`, \`add\`, \`check\`, \`status\` and \`init\`. Register it with the agent's MCP configuration (for Claude Code, \`.mcp.json\` in the project):\n\n${code("json", mcp)}`),
    );
  }

  function foundation(id, href) {
    const [, title, groups] = FOUNDATIONS.find(([f]) => f === id);
    if (id === "icons") {
      const icons = src.icons ?? { icons: {} };
      const rows = Object.entries(icons.icons).map(([n, i]) => [`\`${n}\``, `\`${i.phosphor}\``, i.weight ?? icons.defaultWeight ?? "regular"]);
      return join(`# ${title}`, icons.$description ?? "", "Phosphor icons, one vocabulary for React, Vue and Svelte: `@phosphor-icons/react`, `@phosphor-icons/vue`, `phosphor-svelte` (import each icon from `phosphor-svelte/lib/<Name>Icon`). A component uses only icons from this list. An icon element carries `data-slot=\"icon\"`.", table(["Name", "Phosphor icon", "Weight"], rows));
    }
    const intro = id === "spacing" ? "A 4px grid: Tailwind's default spacing scale (`p-1` is 4px, `gap-2` 8px)." : id === "type" ? "The size utilities (`text-xs` … `text-xl`) set the size only, never the line height." : "";
    return join(`# ${title}`, intro, ...groups.map((g) => tokenGroup(src.tokens, g)));
  }

  /* The page of one component.
   * framework: the page as one project reads it (the tool): its own import and its own examples,
   *   as complete files. `examples` is how many are shown in full (the rest by id and title; `only` is the id of one example to print alone); `base` is
   *   how the project imports from its ui folder.
   * compact (llms-full.txt): React examples only, no recipe source.
   * neither (the docs site's .md page): every framework, and the recipe. */
  function component(spec, href, opts = {}) {
    const { compact = false, framework = null, base, examples: limit = Infinity, only = null } = typeof opts === "boolean" ? { compact: opts } : opts;
    const a = linker(href);
    const targets = targetsOf(spec);
    const shown = framework ? [framework] : targets;
    const cat = CATEGORIES.find(([c]) => c === spec.category)?.[1] ?? spec.category;
    const facts = [`Kind: ${spec.kind === "block" ? "block" : "component"}`, `Category: ${cat}`, `Status: ${spec.status}`, `Targets: ${targets.map((f) => FW_LABEL[f]).join(", ")}`, ...(spec.engine ? [`Behaviour: Zag \`${spec.engine}\` machine, through Ark UI`] : [])].join(" · ");
    const deps = spec.dependencies ?? [];
    const builtFrom = deps.map((d) => a(specOf(d)?.title ?? d, `/components/${d}.md`));
    const install = `${code("bash", installCommand(spec.name))}\n\nIt writes the folder \`${spec.name}/\` into the project's ui folder (\`index.ts\`, ${shown.map((fw) => `\`${adapterFile(fw, spec.name)}\``).join(", ")}, \`${spec.name}.recipe.ts\`)${builtFrom.length ? `, and what it is built from: ${builtFrom.join(", ")}` : ""}.${framework ? "" : ` First time: ${a("Installation", "/installation.md")}.`}`;
    const ex = src.examples?.[spec.name];
    const usageBlock = shown.map((fw) => code(FENCE[fw], `import { ${pascal(spec.name)} } from "${importPath(fw, spec.name, base)}";`)).join("\n\n")
      + (base?.startsWith(".") ? "\n\nThe project has no import alias, so the paths here are written as from a file at the top of `src/`: adjust them to the file that imports." : "");
    const partRows = (spec.anatomy ?? []).map((p) => [
      `\`${p.part}\``, p.element ? `\`${p.element}\`` : "", `\`${p.part === "root" ? spec.name : `${spec.name}-${p.part}`}\``,
      [p.optional ? "optional" : "", p.repeat ? "repeats" : ""].filter(Boolean).join(", "), p.description ?? "",
    ]);
    const cap = (k) => k[0].toUpperCase() + k.slice(1);
    const bindable = (k) => ({ react: `\`default${cap(k)}\` and \`on${cap(k)}Change\``, vue: `\`v-model:${k}\``, svelte: `\`bind:${k}\`` });
    const propRows = Object.entries(spec.props ?? {}).map(([k, p]) => [`\`${k}\``, `\`${propType(p)}\``, p.default === undefined ? "" : `\`${JSON.stringify(p.default)}\``, `${p.model ? `Bindable (${shown.map((fw) => `${framework ? "" : `${FW_LABEL[fw]}: `}${bindable(k)[fw]}`).join("; ")}). ` : ""}${p.description ?? ""}`]);
    const events = Object.entries(spec.events ?? {}).filter(([, d]) => !/^Archived/.test(d));
    const a11y = spec.a11y ?? {};
    const a11yBody = [a11y.role ? `Role: ${a11y.role}.` : "", a11y.keyboard?.length ? `Keyboard:\n\n${bullets(a11y.keyboard)}` : "", a11y.notes?.length ? `Notes:\n\n${bullets(a11y.notes)}` : ""].filter(Boolean).join("\n\n");
    const list = ex?.index?.examples ?? [];
    const exampleFws = compact ? shown.filter((fw) => fw === "react") : shown;
    const titles = (some) => bullets(some.map((e) => `\`${e.file}\`: ${e.title ?? e.file}${e.description ? `. ${e.description}` : ""}`));
    const inFull = (e) => {
      const files = exampleFws.map((fw) => [fw, `${e.file}.${EXT[fw]}`]).filter(([, f]) => ex.files?.[f] !== undefined);
      if (!files.length) return "";
      return [`### ${e.title ?? e.file}`, e.description ?? "", ...files.map(([fw, f]) => `${framework ? "" : `${FW_LABEL[fw]} · `}\`${f}\`\n\n${code(FENCE[fw], toProjectImports(ex.files[f], fw, src.exports?.[fw] ?? {}, base ?? importBase(fw)))}`)].filter(Boolean).join("\n\n");
    };
    /* one example, and nothing else of the page */
    if (only) return inFull(list.find((e) => e.file === only) ?? { file: only });
    const more = list.slice(limit);
    const examples = [...list.slice(0, limit).map(inFull).filter(Boolean), more.length ? `More examples. One of them as a complete file: \`${COMMAND} docs ${spec.name} --example <id>\`; all of them: \`--all-examples\`.\n\n${titles(more)}` : ""].filter(Boolean).join("\n\n");
    const recipe = !src.recipes?.[spec.name] ? ""
      : framework ? `\`${spec.name}/${spec.name}.recipe.ts\`, in the project's ui folder once the component is added: every class of every part. Read it to customise the component; a lasting change of look is a variant there, not classes repeated at every use.`
      : compact ? `In ${a(`${spec.name}.md`, `/components/${spec.name}.md`)}, with the Vue and Svelte examples.`
      : `\`${spec.name}.recipe.ts\`:\n\n${code("ts", src.recipes[spec.name])}`;
    return join(
      `# ${spec.title}`, spec.summary, spec.description, facts,
      section("Add", install),
      section("Usage", usageBlock),
      section("Parts", `In the DOM the root carries \`data-slot="${spec.name}"\` and each part \`data-slot="${spec.name}-<part>"\`; in the recipe the root is the \`base\` slot and each part a slot named after it in camelCase.\n\n${table(["Part", "Element", "data-slot", "Flags", "Notes"], partRows)}`),
      section("Props", `${table(["Prop", "Type", "Default", "Description"], propRows)}${Object.keys(spec.props ?? {}).length ? "\n\nOther attributes and `class` go to the root; `class` is merged through the recipe." : ""}`),
      section("Events", table(["Event", "Payload"], events.map(([k, d]) => [`\`${k}\``, d]))),
      section("Slots", table(["Slot", "Content"], Object.entries(spec.slots ?? {}).map(([k, d]) => [`\`${k}\``, d]))),
      section("States", (spec.states ?? []).map((s) => `\`${s}\``).join(", ")),
      section("Keyboard and accessibility", a11yBody),
      section("Motion", bullets(spec.motion)),
      section("Tokens", (spec.tokens ?? []).map((t) => `\`${t}\``).join(", ")),
      section("Dependencies", deps.map((d) => `- ${a(specOf(d)?.title ?? d, `/components/${d}.md`)}`).join("\n")),
      section("Notes", bullets(spec.notes)),
      section("Examples", examples),
      section("Recipe", recipe),
    );
  }

  function guide(g, href) {
    const body = guideLinks(g.markdown, g.id, href);
    /* a doc that opens with its own heading keeps it, as the page's h1 */
    const own = body.match(/^\s*#{1,3}\s+(.+)\n/);
    return own ? body.replace(/^\s*#{1,3}\s+/, "# ").replace(/\n*$/, "\n") : join(`# ${g.title}`, body);
  }

  function render(path, href, opts = false) {
    const compact = typeof opts === "boolean" ? opts : !!opts.compact;
    let m;
    if (path === "/index.md") return overview(href);
    if (path === "/installation.md") return installation(href, typeof opts === "boolean" ? {} : opts);
    if ((m = path.match(/^\/foundations\/(.+)\.md$/)) && FOUNDATIONS.some(([f]) => f === m[1])) return foundation(m[1], href);
    if ((m = path.match(/^\/components\/(.+)\.md$/)) && specOf(m[1])) return component(specOf(m[1]), href, typeof opts === "boolean" ? { compact } : opts);
    if ((m = path.match(/^\/guides\/(.+)\.md$/))) { const g = guides.find((x) => x.id === m[1]); if (g) return guide(g, href); }
    return null;
  }

  function llmsTxt(href) {
    const a = linker(href);
    const groups = ["Overview", "Foundations", "Components", "Blocks", "Guides"];
    const line = (p) => `- ${a(p.title, p.path)}${p.summary ? `: ${p.summary}` : ""}`;
    const body = groups.map((g) => {
      const list = pages.filter((p) => p.group === g);
      if (g === "Components" || g === "Blocks") {
        const cats = [...CATEGORIES, ["", "Other"]].map(([c, label]) => [label, list.filter((p) => (c ? p.category === c : !CATEGORIES.some(([x]) => x === p.category)))]).filter(([, l]) => l.length);
        return `## ${g}\n\n${cats.map(([label, l]) => `### ${label}\n\n${l.map(line).join("\n")}`).join("\n\n")}`;
      }
      return `## ${g}\n\n${list.map(line).join("\n")}`;
    });
    return join(
      "# fndn/ui", `> ${SUMMARY}`,
      `Every page of the docs is also Markdown: add \`.md\` to its path (\`/components/button.md\`). ${a("llms-full.txt", "/llms-full.txt")} is every page in one file. A component page gives its parts (\`data-slot\` names), props, states, keyboard and accessibility contract, motion, tokens, example files for each framework and its recipe.`,
      section("Install", `Set the project up once, then add components; they are written into the project as files it owns (${a("Installation", "/installation.md")}):\n\n${code("bash", `${COMMAND} init\n${COMMAND} add <name>\n${COMMAND} check`)}\n\nThe same package is an MCP server (\`${COMMAND} mcp\`) with the tools \`search\`, \`docs\`, \`add\`, \`check\`, \`status\` and \`init\`.`),
      ...body,
    );
  }

  function llmsFull(href) {
    return [llmsTxt(href), ...pages.map((p) => render(p.path, href, true)).filter(Boolean)].join("\n---\n\n");
  }

  return { pages, render, llmsTxt, llmsFull, specs };
}
