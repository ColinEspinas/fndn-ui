/* The docs as Markdown, for agents: the sources of the Markdown endpoints (/llms.txt,
 * /llms-full.txt, /<page>.md), read from the same files as the HTML pages (lib/content.ts), and
 * rendered by the generator the `fndn` tool uses (packages/cli/src/render.js). Not a route (leading _). */
import { agentDocs, type AgentSources, type Href } from "../../../../packages/cli/src/render.js";
import { guideOf, guides, library, specs } from "../lib/catalog";
import { baseOf, componentOf, derive, glob, readJson, readText } from "../lib/content";
import { FRAMEWORKS } from "../lib/types";

/* each component's folder: its spec, its recipe (as `fndn add` writes it), its examples
 * (examples/index.json and one file per example and framework), its adapters (where every
 * exported name lives, so an example is shown with the imports a project writes) */
const INPUTS = ["components/*/*.{json,ts,tsx,vue,svelte}", "components/*/examples/*.{json,tsx,vue,svelte}", "spec/tokens.json", "spec/icons.json", "docs/**/*.md"];

/** The generator over the current files (read through lib/content.ts; recomputed in dev when one changes). */
export const docs = () => derive("agent-docs", INPUTS, () => {
  const all = specs();
  const recipes = Object.fromEntries(all.flatMap((s) => glob(`components/${s.name}/${s.name}.recipe.ts`).map((f) => [s.name, readText(f)])));
  const examples: NonNullable<AgentSources["examples"]> = {};
  for (const f of glob("components/*/examples/index.json")) examples[componentOf(f)] = { index: readJson(f), files: {} };
  for (const f of glob("components/*/examples/*.{tsx,vue,svelte}")) (examples[componentOf(f)] ??= { files: {} }).files[baseOf(f)] = readText(f);
  const exports = Object.fromEntries(FRAMEWORKS.map((fw) => [fw, library(fw).exports]));
  return agentDocs({
    specs: all.map((s) => readJson(`components/${s.name}/${s.name}.json`)) as AgentSources["specs"],
    tokens: readJson("spec/tokens.json"), icons: readJson("spec/icons.json"), recipes, examples, exports,
    guides: guides().map((g) => ({ id: g.id, title: g.title, markdown: g.markdown })),
  });
});

/* links on the site: absolute when the config has a `site`, else from the root */
const origin = (import.meta.env.SITE ?? "").replace(/\/$/, "");
export const href: Href = (to) => {
  /* a link from a guide to a Markdown file of docs/ the site does not publish stays plain text */
  const guide = to.match(/^\/guides\/(.+)\.md$/);
  if (guide) { const g = guideOf(guide[1]!.toLowerCase()); return g ? `${origin}/guides/${g.id}.md` : null; }
  return `${origin}${to}`;
};

export const markdown = (body: string | null) =>
  body === null
    ? new Response("Not found\n", { status: 404, headers: { "content-type": "text/markdown; charset=utf-8" } })
    : new Response(body, { headers: { "content-type": "text/markdown; charset=utf-8" } });
export const text = (body: string) => new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
