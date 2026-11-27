/* The code under the playground's stage: exactly what the stage shows (the playground, or a worst
 * case) with the inspector's overrides, in the selected framework. Example files are shown as
 * written (lib/examples.ts); this is the one place where the code is generated and follows the props.
 *
 * Written the way the stage renders it, with only the props that differ from the spec's defaults:
 * JSON props as props, `text` as children / default slot,
 * `width` as an inline style; props the spec marks `model` are bound in the target's idiom (React's
 * uncontrolled default, Vue's v-model, Svelte's bind:). Strings are attributes, true is a bare flag,
 * numbers and data are expressions; data longer than a line, or an array of more than 8 entries, is
 * hoisted into a const above (such an array shows its first 3 and says how many more).
 *
 * Pure: no DOM, no imports but types. */
import type { Example, Framework, Spec } from "./types";

const pascal = (k: string) => k.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase());
const cap = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);
const IDENT = /^[A-Za-z_$][\w$]*$/;
const MAX_LINE = 80;
const MAX_ENTRIES = 8;

export type UsageInput = { spec: Pick<Spec, "name" | "props">; fw: Framework; example: Example | undefined; overrides: Record<string, unknown> };

/* ── JS literals ─────────────────────────────────────────────── */
const str = (s: string, q: string) => q + s.replace(/\\/g, "\\\\").replace(new RegExp(q, "g"), `\\${q}`).replace(/\n/g, "\\n") + q;

/** One-line literal. */
function lit(v: unknown, q = '"'): string {
  if (v === null || v === undefined) return String(v);
  if (typeof v === "string") return str(v, q);
  if (typeof v !== "object") return String(v);
  if (Array.isArray(v)) return `[${v.map((x) => lit(x, q)).join(", ")}]`;
  const e = Object.entries(v as Record<string, unknown>);
  return e.length ? `{ ${e.map(([k, x]) => `${IDENT.test(k) ? k : str(k, q)}: ${lit(x, q)}`).join(", ")} }` : "{}";
}
const hasLongArray = (v: unknown): boolean =>
  !!v && typeof v === "object" && (Array.isArray(v) ? v.length > MAX_ENTRIES || v.some(hasLongArray) : Object.values(v).some(hasLongArray));

/** A string of several lines (code) as a template literal, its lines as they are. */
const tpl = (s: string) => "`" + s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${") + "`";

/** Multi-line literal starting at column `indent`; arrays of more than 8 show 3 and a count. */
function pretty(v: unknown, indent: number, q = '"'): string {
  if (typeof v === "string" && v.includes("\n")) return tpl(v);
  const one = lit(v, q);
  if (!v || typeof v !== "object" || (indent + one.length <= MAX_LINE && !hasLongArray(v))) return one;
  const pad = " ".repeat(indent + 2);
  if (Array.isArray(v)) {
    const shown = v.length > MAX_ENTRIES ? v.slice(0, 3) : v;
    const rest = v.length - shown.length;
    return `[\n${shown.map((x) => `${pad}${pretty(x, indent + 2, q)},`).join("\n")}${rest ? `\n${pad}// … ${rest} more` : ""}\n${" ".repeat(indent)}]`;
  }
  return `{\n${Object.entries(v as Record<string, unknown>).map(([k, x]) => `${pad}${IDENT.test(k) ? k : str(k, q)}: ${pretty(x, indent + 2, q)},`).join("\n")}\n${" ".repeat(indent)}}`;
}

/* ── component usage ─────────────────────────────────────────── */
type Decl = { name: string; value: unknown; model: boolean };

function frameworkUsage(spec: UsageInput["spec"], fw: Framework, ex: Example, props: Record<string, unknown>): string {
  const Name = pascal(spec.name);
  const models = new Set(Object.entries(spec.props).filter(([, d]) => d.model).map(([k]) => k));
  const decls: Decl[] = [];
  const attrs: string[] = [];
  const q = fw === "vue" ? "'" : '"';
  const expr = (name: string, code: string) => (fw === "vue" ? `:${name}="${code.replace(/"/g, "&quot;")}"` : `${name}={${code}}`);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined) continue;
    /* a prop at its default is left out: the code a developer would paste */
    const def = spec.props[k]?.default;
    if (def !== undefined && JSON.stringify(v) === JSON.stringify(def)) continue;
    const model = models.has(k);
    if (model && fw !== "react") {
      decls.push({ name: k, value: v, model: true });
      attrs.push(fw === "vue" ? `v-model:${k}="${k}"` : `bind:${k}={${k}}`);
      continue;
    }
    const name = model ? `default${cap(k)}` : k;
    if (typeof v === "string" && !/["\n]/.test(v) && !(fw === "svelte" && /[{}]/.test(v))) attrs.push(`${name}="${v.replace(/&/g, "&amp;")}"`);
    /* a string of several lines (a code block's value) is declared above, as a template literal */
    else if (typeof v === "string" && v.includes("\n")) {
      decls.push({ name: k, value: v, model: false });
      attrs.push(expr(name, k));
    } else if (v === true) attrs.push(name);
    else if (v && typeof v === "object" && (`${name}={${lit(v, q)}}`.length > MAX_LINE || hasLongArray(v))) {
      decls.push({ name: k, value: v, model: false });
      attrs.push(expr(name, k));
    } else attrs.push(expr(name, lit(v, q)));
  }
  if (ex.width) attrs.push(fw === "react" ? `style={{ width: ${ex.width} }}` : `style="width: ${ex.width}px"`);

  const text = ex.text;
  const body = text === undefined || text === "" ? null
    : /[{}<>&]/.test(text) ? (fw === "vue" ? `{{ ${str(text, '"')} }}` : `{${str(text, '"')}}`)
    : text;
  const base = fw === "vue" ? 2 : 0;
  const oneLine = `<${Name}${attrs.map((a) => ` ${a}`).join("")}${body === null ? " />" : `>${body}</${Name}>`}`;
  let tag: string;
  if (base + oneLine.length <= MAX_LINE && !oneLine.includes("\n")) tag = oneLine;
  else {
    const open = attrs.length ? `<${Name}\n${attrs.map((a) => `  ${a}`).join("\n")}\n` : `<${Name}`;
    tag = body === null ? `${open}${attrs.length ? "/>" : " />"}` : `${open}>\n  ${body}\n</${Name}>`;
  }

  /* a component is imported from its folder, the same way in every framework */
  const importPath = `${fw === "svelte" ? "$lib" : "@"}/components/ui/${spec.name}`;
  if (fw === "react") {
    const consts = decls.map((d) => `const ${d.name} = ${pretty(d.value, 0)};`);
    return [`import { ${Name} } from "${importPath}";`, "", ...(consts.length ? [consts.join("\n\n"), ""] : []), tag].join("\n");
  }
  if (fw === "vue") {
    const consts = decls.map((d) => (d.model ? `const ${d.name} = ref(${pretty(d.value, 0)});` : `const ${d.name} = ${pretty(d.value, 0)};`));
    const needsRef = decls.some((d) => d.model);
    return [
      `<script setup lang="ts">`,
      ...(needsRef ? [`import { ref } from "vue";`] : []),
      `import { ${Name} } from "${importPath}";`,
      ...(consts.length ? ["", consts.join("\n\n")] : []),
      `</script>`, "", `<template>`, tag.split("\n").map((l) => `  ${l}`).join("\n"), `</template>`,
    ].join("\n");
  }
  const consts = decls.map((d) => (d.model ? `  let ${d.name} = $state(${pretty(d.value, 2)});` : `  const ${d.name} = ${pretty(d.value, 2)};`));
  return [`<script lang="ts">`, `  import { ${Name} } from "${importPath}";`, ...(consts.length ? ["", consts.join("\n\n")] : []), `</script>`, "", tag].join("\n");
}

/** The code for React, Vue or Svelte: `example` with the overrides merged over its props. */
export function usageCode({ spec, fw, example, overrides }: UsageInput): string {
  if (!example) return fw === "vue" ? "<!-- No playground for this component yet. -->" : "// No playground for this component yet.";
  return frameworkUsage(spec, fw, example, { ...example.props, ...overrides });
}

export const usagePath = (fw: Framework) => (fw === "react" ? "example.tsx" : fw === "vue" ? "Example.vue" : "Example.svelte");
