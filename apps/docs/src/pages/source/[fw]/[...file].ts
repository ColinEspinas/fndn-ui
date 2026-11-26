/* The source of one file a project gets from `fndn add`, as plain text, by its path in the ui folder
 * (/source/react/card/card.tsx, /source/vue/lib/tv.ts): the component page fetches a file when its
 * tab is opened, so no page carries sources in its markup. */
import type { APIRoute } from "astro";
import { library } from "../../../lib/catalog";
import { FRAMEWORKS } from "../../../lib/types";

export function getStaticPaths() {
  return FRAMEWORKS.flatMap((fw) => Object.keys(library(fw).files).map((file) => ({ params: { fw, file } })));
}

export const GET: APIRoute = ({ params }) => {
  const fw = params.fw as (typeof FRAMEWORKS)[number];
  const code = FRAMEWORKS.includes(fw) ? library(fw).files[params.file!]?.content : undefined;
  if (code === undefined) return new Response("Not found", { status: 404 });
  return new Response(code, { headers: { "content-type": "text/plain; charset=utf-8" } });
};
