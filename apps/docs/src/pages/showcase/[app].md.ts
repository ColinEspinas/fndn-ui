/* /showcase/<app>.md: a showcase app as Markdown, for agents: what it is, then its source files. */
import type { APIRoute } from "astro";
import { markdown } from "../_agent-docs";
import { showcaseFiles, showcaseOf, showcases } from "../../lib/showcase";

export function getStaticPaths() {
  return showcases().map((s) => ({ params: { app: s.name } }));
}

export const GET: APIRoute = ({ params }) => {
  const s = showcaseOf(params.app!);
  if (!s) return markdown(null);
  const files = showcaseFiles(s.name).map((f) => `## ${f.file}\n\n\`\`\`tsx\n${f.code}\n\`\`\``);
  return markdown([`# ${s.title}`, s.description, "A whole app screen built only from this system's components and token utilities; the layout is Tailwind.", ...(s.shape ? [`A ${s.shape} app: its page has \`<html data-shape="${s.shape}">\`, so its buttons, toggles and segmented controls name no shape.`] : []), ...files].join("\n\n") + "\n");
};
