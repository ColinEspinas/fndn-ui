/* Markdown of docs/ to HTML at build time (marked, GFM). Links between docs stay on the site
 * (/guides/<id>); a link to a file outside docs/ names the file instead of linking; external links
 * open in a new tab; tables scroll inside their own box. Server only. */
import { Marked } from "marked";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ── what the public page leaves out ──────────────────────────────
 * The guides are also the rules that the library's maintainers and agents work by, so their source
 * names the scripts that check them. A reader of the site has no use for those: the page drops the
 * parentheticals and the sentences that point into the repository's process (scripts/, plans/,
 * .claude/). */
const INTERNAL = /`?(?:\.\/)?(?:scripts|plans|\.claude)\/[^\s`]*`?/;
/* a parenthetical: plain text and `code` spans, which may hold parentheses of their own */
const PAREN = /\s*\((?:[^()`]|`[^`]*`)*\)/g;

function publicText(text: string): string {
  const t = text.replace(PAREN, (m) => (INTERNAL.test(m) ? "" : m));
  if (!INTERNAL.test(t)) return t;
  /* a sentence that points into the repository goes whole */
  return t.split(/(?<=[.!?])\s+(?=[A-Z`*(])/).filter((x) => !INTERNAL.test(x)).join(" ");
}

/** The guide's Markdown as the public page shows it (the source file is unchanged). */
export function publicMarkdown(markdown: string): string {
  const out: string[] = [];
  let fence = false;
  /* paragraphs and list items are joined into one line first, so a sentence is whole */
  let block: string[] = [];
  const flush = () => {
    if (!block.length) return;
    const items: string[] = [];
    for (const line of block) {
      if (/^\s*(?:[-*+]|\d+\.|>)(?:\s|$)/.test(line) || /^\s*\|/.test(line) || !items.length) items.push(line);
      else items[items.length - 1] += ` ${line.trim()}`;
    }
    for (const item of items) {
      const m = item.match(/^(\s*(?:[-*+]\s+|\d+\.\s+|>\s*)?)([\s\S]*)$/)!;
      const kept = /^\s*\|/.test(item) ? item.replace(/[^|]+/g, (cell) => publicText(cell)) : `${m[1]}${publicText(m[2]!)}`;
      if (kept.trim() && !/^\s*(?:[-*+]|\d+\.|>)\s*$/.test(kept)) out.push(kept);
    }
    block = [];
  };
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) { flush(); fence = !fence; out.push(line); continue; }
    if (fence) { out.push(line); continue; }
    if (!line.trim() || /^\s*#{1,6}\s/.test(line) || /^\s*<!--/.test(line)) { flush(); out.push(line); continue; }
    block.push(line);
  }
  flush();
  return out.join("\n");
}

export const slug = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[`*_]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");

/** The h2 / h3 of a guide as the page renders them, for its "On this page" rail. */
export function guideToc(markdown: string, title: string): { id: string; text: string; depth: number }[] {
  const body = markdown.replace(/^\s*#{1,3}\s+(.+)\n/, (m, h: string) => (h.trim() === title ? "" : m));
  const seen = new Map<string, number>();
  const out: { id: string; text: string; depth: number }[] = [];
  let fence = false;
  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    const m = !fence && line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const text = m[2]!.replace(/`([^`]*)`/g, "$1").replace(/\*\*?([^*]+)\*\*?/g, "$1");
    out.push({ id: unique(seen, slug(text)), text, depth: m[1]!.length });
  }
  return out;
}
const unique = (seen: Map<string, number>, id: string) => { const n = seen.get(id) ?? 0; seen.set(id, n + 1); return n ? `${id}-${n}` : id; };

export function renderGuide(markdown: string, id: string, title: string): string {
  /* the page shows the title as its h1: drop the document's own first heading when it is the title */
  const body = markdown.replace(/^\s*#{1,3}\s+(.+)\n/, (m, h: string) => (h.trim() === title ? "" : m));
  const marked = new Marked({ gfm: true });
  const seen = new Map<string, number>();
  marked.use({
    renderer: {
      heading({ tokens, depth, text }) {
        const plain = text.replace(/`([^`]*)`/g, "$1").replace(/\*\*?([^*]+)\*\*?/g, "$1");
        return `<h${depth} id="${esc(unique(seen, slug(plain)))}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      link({ href, title: t, tokens }) {
        const text = this.parser.parseInline(tokens);
        const tip = t ? ` title="${esc(t)}"` : "";
        if (/^https?:/.test(href)) return `<a href="${esc(href)}"${tip} target="_blank" rel="noreferrer">${text}</a>`;
        if (href.startsWith("#")) return `<a href="${esc(href)}"${tip}>${text}</a>`;
        const url = new URL(href, `https://repo.invalid/docs/${id}.md`);
        const m = url.pathname.match(/^\/docs\/([\w/-]+)\.md$/);
        if (m) return `<a href="/guides/${m[1]}${url.hash}"${tip}>${text}</a>`;
        return `<span title="${esc(url.pathname.slice(1))}">${text}</span>`;
      },
      table(token) {
        const cell = (c: { tokens: any[]; align: string | null }, tag: string) => `<${tag}${c.align ? ` style="text-align:${c.align}"` : ""}>${this.parser.parseInline(c.tokens)}</${tag}>`;
        const head = `<tr>${token.header.map((c) => cell(c, "th")).join("")}</tr>`;
        const rows = token.rows.map((r) => `<tr>${r.map((c) => cell(c, "td")).join("")}</tr>`).join("");
        return `<div class="docs-scroll" role="region" tabindex="0"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
      },
      code({ text, lang }) {
        return `<pre tabindex="0"${lang ? ` data-lang="${esc(lang)}"` : ""}><code>${esc(text)}</code></pre>`;
      },
    },
  });
  return marked.parse(body, { async: false }) as string;
}
