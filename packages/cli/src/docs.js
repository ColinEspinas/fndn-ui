// `fndn docs` and `fndn search`: the documentation, for the framework of the project at hand.
import { agentDocs, COMMAND, FOUNDATIONS } from "./render.js";
import { CATEGORIES, catalog, component, examples, library, needs, oneLine, search } from "./catalog.js";
import { UsageError } from "./add.js";

/** What `docs` takes besides a component's name. */
export const TOPICS = {
  install: "Setting a project up, adding components, checking, the MCP server",
  design: "The design language: surfaces, ink, type, shape, controls, composing a screen",
  motion: "When something moves, how fast, with which utility",
  interaction: "Hover, press, focus, keyboard, choosing among options",
  accessibility: "The floor every component and screen meets",
  authoring: "How a component is built, for building a new one the same way",
  porting: "A component in another framework (Solid, Angular, Lit, plain DOM)",
  rules: "What `check` reports, and why",
  tokens: "Every colour, shadow, radius, type size, duration and easing, with its utility",
  icons: "The icon vocabulary (Phosphor), by name",
};

const RULES = `# What \`check\` reports

\`${COMMAND} check\` reads the project's source. The library's own files pass every rule below, so a
project that passes is built to the standard of the components it uses.

## Errors

| Rule | Reported | Why | Instead |
| --- | --- | --- | --- |
| \`color\` | a Tailwind palette colour (\`bg-gray-100\`, \`text-white\`), a literal colour in a class (\`bg-[#fafafa]\`) | tokens carry a light and a dark value; a fixed colour is right in one theme only | \`bg-surface\`, \`text-ink-2\`, \`border-line\`, \`text-on-ink\` (\`docs tokens\`) |
| \`motion\` | \`transition-*\`, \`duration-200\`, \`ease-in-out\`, \`animate-spin\`, a raw time in an arbitrary transition or animation | one vocabulary gives every hover, press and popup the same timing, and reduced motion is handled once, in the tokens | \`motion-<what>-<timing>\`, \`duration-<token>\`, \`ease-<token>\`, \`animate-fade-up\` (\`docs motion\`) |
| \`scale\` | \`scale-95\`, \`scale-0\`, \`scale(0.9)\` | a scale is feedback of a fixed size; nothing appears from nothing | \`scale-press\`, \`scale-press-sm\`, \`scale-popup\` |
| \`layer\` | a \`z-index\` at or above the floating layers (\`z-50\`) | it would cover a popup or a dialog | \`z-popup\`, \`z-dialog\`, \`z-toast\`, \`z-tooltip\`; \`z-1\` to \`z-4\` inside a component |
| \`shape\` | Tailwind's radius and shadow scales (\`rounded-lg\`, \`shadow-md\`) | radii and shadows are a ladder with meanings (chip, control, card; hairline, card, raised, overlay) | \`rounded-control\`, \`rounded-card\`, \`shadow-card\`, \`shadow-raised\` |
| \`direction\` | a physical side: \`ml-\` \`mr-\` \`pl-\` \`pr-\` (and \`scroll-\`), \`left-\` \`right-\`, \`border-l\` \`border-r\`, \`rounded-l\` \`rounded-r\` \`rounded-tl\` \`rounded-tr\` \`rounded-bl\` \`rounded-br\`, \`text-left\` \`text-right\`, \`float-\` and \`clear-left\`/\`right\`, and the same sides as arbitrary properties (\`[margin-left:…]\`, \`[text-align:right]\`) | a physical side stays put when the page reads right to left | the logical utility: \`ms-\` \`me-\` \`ps-\` \`pe-\`, \`start-\` \`end-\`, \`border-s\` \`border-e\`, \`rounded-s\` \`rounded-ee\` …, \`text-start\` \`text-end\`. A side meant for one direction goes under \`ltr:\` or \`rtl:\`; a position that is physical on purpose (an engine's page coordinates) is written \`[left:…]\` |
| \`name\` | \`<Button square>\` or \`<Toggle square>\` without a name | a screen reader would say only "button" | \`aria-label\`; on a Toggle, \`tooltip\` also names it. A Tooltip around a Button shows a hint and does not name it |
| \`shape\` (in the ui folder) | a component that is not a folder \`<name>/\` with \`<name>.recipe.ts\`, its adapter and an \`index.ts\`; a recipe that does not take \`tv\` from \`../lib/tv\`; an adapter whose root has no \`data-slot\` | app code imports a component from its folder; \`lib/tv\` knows the token classes; parts are found and styled by \`data-slot\` | \`docs authoring\` |
| \`missing\` | an import of a library component that is not in the project | the build would fail on it | \`${COMMAND} add <name>\` |
| in CSS | \`:hover\` outside \`@media (hover: hover) and (pointer: fine)\`, \`transition: all\`, \`ease-in\`, a literal duration, a transition on a layout property, \`scale(0)\` | the same reasons, for hand-written CSS and \`<style>\` blocks | \`var(--fndn-duration-*)\`, \`var(--fndn-easing-*)\` |

## Advice (printed, does not fail)

| Rule | Reported | Why |
| --- | --- | --- |
| \`compose\` | a hand-written \`<button>\`, \`<select>\` or \`<textarea>\` where the project has the component | the component carries the sizes, the press, the focus ring and the keyboard behaviour; a copy drifts |
| \`mount\` | \`animate-fade-up\`, \`animate-fade-in\`, \`animate-pop-in\` in app code | it plays on every mount, so on every page load and navigation; it belongs only on what the code adds while the user watches |

## When a line must break a rule

Put \`fndn-check-ok: <reason>\` in a comment on that line or the line above (a brand colour in a logo,
a chart palette). The reason is for the next reader.

Files the tool wrote and nobody changed are not read: they are the library's. A file you change
becomes yours and is checked like any other.
`;

/** Names a mistyped one probably meant: the same letters ("datepicker"), or a letter or two away. */
function nearest(name) {
  const squash = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const distance = (a, b) => {
    let row = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) row = row.reduce((next, _, j) => [...next, j ? Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) : i], []);
    return row[b.length];
  };
  const wanted = squash(name);
  const c = catalog();
  const all = [...c.components.map((s) => s.name), ...Object.keys(TOPICS)];
  const close = all.filter((n) => { const s = squash(n); return s.includes(wanted) || wanted.includes(s) || distance(s, wanted) <= 2; });
  return (close.length ? close : search(name).map((s) => s.name)).slice(0, 5);
}

/** The generator over the shipped data, with the examples of one framework. */
function generator(framework) {
  const c = catalog();
  const files = examples(framework);
  const lib = library(framework);
  return agentDocs({
    specs: c.components, tokens: c.tokens, icons: c.icons, guides: c.guides,
    examples: Object.fromEntries(Object.entries(c.examples).map(([name, index]) => [name, { index, files: files[name] ?? {} }])),
    recipes: Object.fromEntries(Object.keys(lib.files).filter((f) => f.endsWith(".recipe.ts")).map((f) => [f.split("/")[0], lib.files[f].content])),
    exports: { [framework]: lib.exports },
  });
}
const noLinks = () => null;

/** One line per component, grouped by category. */
export function listing(specs) {
  const out = [];
  for (const [id, label] of CATEGORIES) {
    const group = specs.filter((s) => s.category === id);
    if (group.length) out.push(`${label}`, ...group.map((s) => `  ${s.name.padEnd(20)} ${oneLine(s)}`), "");
  }
  return out.join("\n").trimEnd();
}

/** The components that answer a query, best first; every component when there is none. */
export function find(query, options) {
  const found = search(query, options);
  const next = `Read one before using it: ${COMMAND} docs <name>. Topics: ${Object.keys(TOPICS).join(", ")}.`;
  if (!query) return `${listing(found)}\n\n${next}`;
  if (!found.length) return `Nothing matches "${query}". Every component:\n\n${listing(search("", options))}\n\n${next}`;
  const rows = needs(query).slice(0, 3).map((row) => `${row.need}: ${row.use.replace(/`/g, "")}`);
  const ranked = found.slice(0, 12).map((s) => `${s.name.padEnd(20)} ${oneLine(s)}`);
  return [...(rows.length ? ["Which component for what:", ...rows.map((r) => `  ${r}`), ""] : []), ...ranked, "", next].join("\n");
}

/**
 * The documentation of a component or a topic, as Markdown.
 * `framework` and `base` (how the project imports from its ui folder) come from the project when
 * there is one. `examples`: how many are printed in full; the others are listed by id and title.
 * `example`: the id of one example of a component, printed alone.
 */
export function docs(name, { framework = "react", base, examples = 2, example } = {}) {
  const c = catalog();
  if (!name) return `${Object.entries(TOPICS).map(([t, what]) => `${t.padEnd(16)} ${what}`).join("\n")}\n\nOr a component: ${COMMAND} search`;
  if (name === "rules") return RULES;
  const g = generator(framework);
  if (name === "install") return g.render("/installation.md", noLinks, base ? { framework, base } : {});
  if (name === "tokens") return ["# Tokens", "Every colour, shadow, radius, type size, duration and easing comes from a token. In CSS a token is a custom property (`color.surface` is `--fndn-surface`, `radius.card` is `--fndn-radius-card`); in Tailwind it is a utility (`bg-surface`, `rounded-card`, `shadow-raised`, `text-sm`, `motion-colors-fast`). Colours have a light and a dark value, switched by `class=\"dark\"` or `data-theme=\"dark\"` on an ancestor. `radius.shape` and `radius.shape-sm` are the app's shape, a pill unless the project's `fndn.json` says `\"shape\": \"rounded\"`.", ...FOUNDATIONS.filter(([id]) => id !== "icons").map(([id]) => g.render(`/foundations/${id}.md`, noLinks).replace(/^# /, "## "))].join("\n\n");
  if (name === "icons") return g.render("/foundations/icons.md", noLinks);
  if (c.guides.some((x) => x.id === name)) return g.render(`/guides/${name}.md`, noLinks);
  if (component(name)) {
    const ids = (c.examples[name]?.examples ?? []).map((e) => e.file);
    if (example && !ids.includes(example)) throw new UsageError(`${name} has no example "${example}". Its examples: ${ids.join(", ") || "none"}.`);
    return g.render(`/components/${name}.md`, noLinks, { framework, base, examples, only: example });
  }
  const near = nearest(name);
  throw new UsageError(`No component or topic named "${name}".${near.length ? ` Did you mean: ${near.join(", ")}?` : ""} Topics: ${Object.keys(TOPICS).join(", ")}.`);
}
