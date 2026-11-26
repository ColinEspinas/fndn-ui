/* The Installation page: the `fndn` tool from start to finish, in the framework the top bar selects.
 * Tailwind 4, `init` (what it writes), `add` (what lands where, the one install line it prints),
 * finding and reading, `check`, keeping up to date, then the MCP server and the skill for agents.
 * The sources are read on the server (pages/installation.astro) and passed in. */
import { useEffect, type ReactNode } from "react";
import { CodeBlock, type CodeBlockFile } from "@fndn/components/code-block/code-block.tsx";
import { thaw, useOptions } from "../lib/store";
import { COMMAND, FW_LABEL, UI_DIR, installCommand, type Fw, type SourceFile } from "../lib/types";
import { gated } from "../lib/gate";

export type Helper = { file: string; about: string };
/** One folder `add` writes in the ui folder: a component's (`button`), or `lib`; `by`: the asked
 * components that are built from it, when it was not asked for itself. */
export type Folder = { dir: string; files: string[]; by?: string[] };
export type InstallationProps = {
  /** the stylesheet as `init` writes it, per framework (<ui folder>/styles/) */
  css: Record<Fw, SourceFile[]>;
  /** what `add <addNames>` writes, folder by folder, and the install line it ends with, per framework */
  added: Record<Fw, { folders: Folder[]; install: string }>;
  addNames: string[];
  /** the files of lib/, what several components share */
  helpers: Helper[];
  /** the MCP configuration (from the generator's Installation page) */
  mcp: string;
};

const lines = (s: string) => s.replace(/\n$/, "").split("\n");
const block = (path: string, code: string): CodeBlockFile => ({ path, label: path.split("/").pop(), lines: lines(code), code });

const TAILWIND: Record<Fw, { install: string; file: string; config: string }> = {
  react: {
    install: "npm install tailwindcss @tailwindcss/vite",
    file: "vite.config.ts",
    config: `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n});`,
  },
  vue: {
    install: "npm install tailwindcss @tailwindcss/vite",
    file: "vite.config.ts",
    config: `import { defineConfig } from "vite";\nimport vue from "@vitejs/plugin-vue";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [vue(), tailwindcss()],\n});`,
  },
  svelte: {
    install: "npm install tailwindcss @tailwindcss/vite",
    file: "vite.config.ts",
    config: `import { defineConfig } from "vite";\nimport { sveltekit } from "@sveltejs/kit/vite";\nimport tailwindcss from "@tailwindcss/vite";\n\nexport default defineConfig({\n  plugins: [tailwindcss(), sveltekit()],\n});`,
  },
};
const CSS_PATH: Record<Fw, string> = { react: "src/index.css", vue: "src/style.css", svelte: "src/app.css" };
/* the last line `init` adds after Tailwind: the path from the global stylesheet to <ui folder>/styles/index.css */
const CSS_IMPORT: Record<Fw, string> = { react: "./components/ui/styles/index.css", vue: "./components/ui/styles/index.css", svelte: "./lib/components/ui/styles/index.css" };
const EXAMPLE: Record<Fw, { path: string; code: string }> = {
  react: { path: "src/App.tsx", code: `import { Button } from "@/components/ui/button";\n\nexport default function App() {\n  return <Button variant="primary">Save changes</Button>;\n}` },
  vue: { path: "src/App.vue", code: `<script setup lang="ts">\nimport { Button } from "@/components/ui/button";\n</script>\n\n<template>\n  <Button variant="primary">Save changes</Button>\n</template>` },
  svelte: { path: "src/routes/+page.svelte", code: `<script lang="ts">\n  import { Button } from "$lib/components/ui/button";\n</script>\n\n<Button variant="primary">Save changes</Button>` },
};

function Step({ n, id, title, children }: { n: number; id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="relative mt-12 first:mt-0" data-docs-step={id}>
      <h2 id={id} className="flex items-baseline gap-3 text-lg font-semibold tracking-tight text-ink">
        <span className="font-mono text-sm font-normal text-ink-2 tabular-nums" aria-hidden>{`0${n}`}</span>
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-4">{children}</div>
    </section>
  );
}
const P = ({ children }: { children: ReactNode }) => <p className="max-w-[46rem] text-md leading-relaxed text-ink-2 [unicode-bidi:plaintext]">{children}</p>;
const C = ({ children }: { children: ReactNode }) => <code className="rounded-chip bg-inset px-1 py-0.5 font-mono text-xs text-ink">{children}</code>;
const File = ({ path, code, ...rest }: { path: string; code: string } & Record<string, unknown>) => <CodeBlock filename={path} lines={lines(code)} code={code} className="max-w-none" aria-label={path} {...rest} />;
const Command = ({ cmd, label }: { cmd: string; label: string }) => <CodeBlock variant="command" lines={[cmd]} code={cmd} aria-label={label} className="max-w-none" />;

const A = ({ href, children }: { href: string; children: ReactNode }) => <a href={href} className="font-medium text-ink underline decoration-line-strong underline-offset-4">{children}</a>;
/** A list of terms and what they are: the folders `add` writes, the files of lib/. */
const Terms = ({ items, ...rest }: { items: { term: ReactNode; about: ReactNode }[] } & Record<string, unknown>) => (
  <ul className="flex max-w-[46rem] flex-col divide-y divide-line-soft border-y border-line-soft" {...rest}>
    {items.map((t, i) => (
      <li key={i} className="flex flex-col gap-1 py-3">
        <span className="font-mono text-sm font-medium text-ink">{t.term}</span>
        <span className="text-sm text-ink-2 [unicode-bidi:plaintext]">{t.about}</span>
      </li>
    ))}
  </ul>
);

export default gated(Installation, () => <div className="min-h-dvh" aria-hidden />);

function Installation({ css, added, addNames, helpers, mcp }: InstallationProps) {
  const { fw } = useOptions();
  useEffect(() => thaw(), []);
  const tw = TAILWIND[fw];
  const dir = UI_DIR[fw];
  const appCss = `@import "tailwindcss";\n@import "@fontsource-variable/inter";\n@import "@fontsource-variable/jetbrains-mono";\n@import "${CSS_IMPORT[fw]}";`;
  const add = added[fw];
  return (
    <div data-docs-install={fw}>
      <p className="mb-10 text-sm text-ink-2">{`Shown for ${FW_LABEL[fw]}: the switch in the top bar changes the steps that differ.`}</p>

      <Step n={1} id="tailwind" title="Tailwind 4">
        <P>
          Every recipe is a list of Tailwind classes, so the project needs Tailwind 4 and its Vite plugin, and a global
          stylesheet that starts with <C>@import "tailwindcss";</C>.
        </P>
        <Command cmd={tw.install} label="Install Tailwind" />
        <File path={tw.file} code={tw.config} />
      </Step>

      <Step n={2} id="init" title="Set the project up">
        <Command cmd={`${COMMAND} init`} label="Set the project up" />
        <P>It reads the framework from <C>package.json</C> (<C>--framework</C> to say it) and writes:</P>
        <Terms data-docs-init items={[
          { term: "fndn.json", about: <>The framework, the folder the library lives in (<C>{dir}</C>; <C>--dir</C> to choose another) and a hash of every file the tool writes, which is how it tells its files from your changes.</> },
          { term: `${dir}/styles/`, about: <>The stylesheet: the tokens for light and dark, the theme that turns them into utilities such as <C>bg-surface</C>, <C>rounded-control</C> and <C>motion-colors-fast</C>, and a few global rules.</> },
          { term: CSS_PATH[fw], about: <>Three lines right after Tailwind: the fonts the system is drawn for (Inter and JetBrains Mono, from the <C>@fontsource-variable</C> packages its install line names; <C>--no-fonts</C> leaves them out and the type falls back to the system font), then the stylesheet.</> },
          { term: ".claude/skills/fndn/", about: <>The skill that tells a coding agent how to build with the system (<C>--no-skill</C> leaves it out).</> },
        ]} />
        <File path={CSS_PATH[fw]} code={appCss} data-docs-app-css />
        <CodeBlock files={css[fw].map((f) => block(f.path, f.code))} maxHeight={360} className="max-w-none" aria-label="The stylesheet's files" data-docs-css />
        <P>
          Dark mode: the tokens switch under <C>class="dark"</C> or <C>data-theme="dark"</C> on an ancestor, usually{" "}
          <C>{"<html>"}</C>; following <C>prefers-color-scheme</C> is the app's choice. Right-to-left: set <C>dir="rtl"</C> on{" "}
          <C>{"<html>"}</C> and the components follow it.
        </P>
      </Step>

      <Step n={3} id="add" title="Add components">
        <Command cmd={installCommand(addNames.join(" "))} label="Add components" />
        <P>
          Each component gets a folder of its own in <C>{dir}</C>: its <C>index.ts</C>, which is what app code imports, its
          adapter, its recipe (every class of every part) and, when it has some, the logic the adapter needs. Everything those
          files import comes with them, followed to the end: the components they are built from, each in its own folder, and{" "}
          <C>lib/</C>, what several components share. For these two:
        </P>
        <Terms data-docs-added items={add.folders.map((f) => ({
          term: `${f.dir}/`,
          about: (
            <span className="flex flex-col gap-1">
              <span className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-ink-2">{f.files.map((x) => <span key={x}>{x}</span>)}</span>
              {f.by?.length ? <span>{`Comes with ${f.by.join(" and ")}, which ${f.by.length > 1 ? "are" : "is"} built from it.`}</span> : null}
              {f.dir === "lib" && <span>What several components share: the first component that needs a file brings it.</span>}
            </span>
          ),
        }))} />
        <P>The command ends with the one install line for the npm packages those files import:</P>
        <Command cmd={add.install} label="Install the packages the files import" />
        <P>
          A component is imported from its folder, the same way in React, Vue and Svelte. The files are yours to edit; one you
          have changed is never overwritten.
        </P>
        <File path={EXAMPLE[fw].path} code={EXAMPLE[fw].code} data-docs-usage />
        <P>What <C>lib/</C> holds:</P>
        <Terms data-docs-helpers items={helpers.map((h) => ({ term: h.file, about: h.about }))} />
      </Step>

      <Step n={4} id="find" title="Find and read">
        <Command cmd={`${COMMAND} search "pick a date"`} label="Search the components" />
        <Command cmd={`${COMMAND} docs date-picker`} label="Read a component's documentation" />
        <P>
          <C>search</C> lists the components that answer a need, all of them without a query. <C>docs {"<name>"}</C> prints a
          component's contract (parts, props, keyboard, motion) and its examples in the project's framework. <C>docs</C> also
          takes a topic: <C>design</C>, <C>motion</C>, <C>interaction</C>, <C>accessibility</C>, <C>authoring</C> (how to build
          a new component the way the system builds its own), <C>tokens</C>, <C>icons</C>. The{" "}
          <A href="/">overview</A> shows every component live.
        </P>
      </Step>

      <Step n={5} id="check" title="Check">
        <Command cmd={`${COMMAND} check`} label="Check the project" />
        <P>
          It reads the project's source and reports what breaks the system's rules: a Tailwind palette colour or a literal
          colour where a token belongs; Tailwind's own <C>transition-*</C>, durations, easings and animations where the motion
          utilities belong; Tailwind's radius and shadow scales; an icon-only button without a name; in hand-written CSS, a
          hover that is not gated to a real pointer or a literal duration.
        </P>
        <P>
          Run it before a piece of UI is called done. The library's own source passes the same check, so a project that passes
          is built to the same standard.
        </P>
      </Step>

      <Step n={6} id="update" title="Keep up to date">
        <Command cmd={`${COMMAND} status`} label="See what changed" />
        <Command cmd={`${COMMAND} update`} label="Update the components" />
        <Command cmd={`${COMMAND} remove select`} label="Remove a component" />
        <P>
          <C>status</C> lists the files you have changed and the ones the library has improved since. <C>update</C> rewrites the
          files that are still the library's and leaves yours alone. <C>remove</C> deletes a component and whatever only it
          needed; a component that another one is built from, or that a component of your own imports, stays, and so does a
          file you have changed.
        </P>
      </Step>

      <Step n={7} id="agents" title="For agents">
        <P>
          The same package speaks the Model Context Protocol over stdio, with the tools <C>search</C>, <C>docs</C>, <C>add</C>,{" "}
          <C>check</C>, <C>status</C> and <C>init</C>. Register it in the agent's MCP configuration; for Claude Code,{" "}
          <C>.mcp.json</C> in the project:
        </P>
        {mcp && <File path=".mcp.json" code={mcp} data-docs-mcp />}
        <P>
          <C>init</C> also writes the skill to <C>.claude/skills/fndn/</C>: the rules for building with these components, which the
          agent follows whenever it adds or changes UI in the project.
        </P>
      </Step>
    </div>
  );
}
