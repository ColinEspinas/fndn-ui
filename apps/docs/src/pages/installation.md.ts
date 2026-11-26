/* /installation.md: the Installation page as Markdown, every framework in turn. */
import type { APIRoute } from "astro";
import { docs, href, markdown } from "./_agent-docs";

export const GET: APIRoute = () => markdown(docs().render("/installation.md", href));
