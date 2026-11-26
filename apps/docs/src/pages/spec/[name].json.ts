/* What a component page's island needs, as JSON: from the spec (props, anatomy, a11y, motion,
 * tokens, targets), from components/<name>/examples/index.json (the playground's starting point and the list
 * of example files) and from the test fixtures (the worst cases the Worst case switch shows).
 * Fetched by the island, so a page with large data stays small. */
import type { APIRoute } from "astro";
import { specs, worstCasesOf } from "../../lib/catalog";
import { exampleIndexOf, exampleList } from "../../lib/examples";

export function getStaticPaths() {
  return specs().map((s) => ({ params: { name: s.name } }));
}

export const GET: APIRoute = ({ params }) => {
  const s = specs().find((x) => x.name === params.name);
  if (!s) return new Response("{}", { status: 404 });
  const index = exampleIndexOf(s.name);
  const island = {
    name: s.name, title: s.title, description: "", kind: s.kind, category: s.category, status: s.status, props: s.props,
    files: s.files, targets: s.targets,
    playground: index ? { name: "Playground", ...index.playground } : undefined,
    exampleFiles: exampleList(s.name),
    worstCase: worstCasesOf(s.name),
    anatomy: s.anatomy, slots: s.slots, events: s.events, states: s.states, tokens: s.tokens, a11y: s.a11y, motion: s.motion,
  };
  return new Response(JSON.stringify(island), { headers: { "content-type": "application/json" } });
};
