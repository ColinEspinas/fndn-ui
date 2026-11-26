// Types of render.js (the Markdown generator shared by the tool and the docs site).
export type Href = (to: string) => string | null;
export type AgentPage = { path: string; title: string; group: string; category?: string; summary: string };
export type AgentSources = {
  specs: Array<Record<string, any> & { name: string; title: string; description: string; kind: string; category: string }>;
  tokens: Record<string, any>;
  icons?: Record<string, any>;
  guides: Array<{ id: string; title: string; markdown: string }>;
  examples?: Record<string, { index?: { playground?: Record<string, any>; examples?: Array<{ file: string; title?: string; description?: string }> }; files: Record<string, string> }>;
  recipes?: Record<string, string>;
  /** per framework: exported name → component (imports.js, exportTable) */
  exports?: Record<string, Record<string, string>>;
};
export type AgentDocs = {
  pages: AgentPage[];
  render(path: string, href: Href, opts?: boolean | { compact?: boolean; framework?: string; base?: string; examples?: number; only?: string | null }): string | null;
  llmsTxt(href: Href): string;
  llmsFull(href: Href): string;
  specs: AgentSources["specs"];
};
export declare const COMMAND: string;
export declare const FRAMEWORKS: string[];
export declare const FOUNDATIONS: Array<[id: string, title: string, groups: string[]]>;
export declare const SUMMARY: string;
export declare function pascal(kebab: string): string;
export declare function installCommand(name: string): string;
export declare function agentDocs(sources: AgentSources): AgentDocs;
