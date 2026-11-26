/* /guides/<id>.md: a guide (docs/<id>.md) as Markdown, its links to other guides kept on the site. */
import type { APIRoute } from "astro";
import { guides } from "../../lib/catalog";
import { docs, href, markdown } from "../_agent-docs";

export function getStaticPaths() {
  return guides().map((g) => ({ params: { id: g.id } }));
}

export const GET: APIRoute = ({ params }) => markdown(docs().render(`/guides/${params.id}.md`, href));
