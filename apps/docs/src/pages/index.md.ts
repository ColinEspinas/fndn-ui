/* /index.md: the overview page as Markdown. */
import type { APIRoute } from "astro";
import { docs, href, markdown } from "./_agent-docs";

export const GET: APIRoute = () => markdown(docs().render("/index.md", href));
