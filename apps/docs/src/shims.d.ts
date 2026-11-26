/* Ark for Vue and Svelte is resolved from components/, whose dependency it is (astro.config.mjs,
 * arkFromComponents), so this app does not depend on it directly. */
declare module "@ark-ui/vue/locale" {
  export const LocaleProvider: import("vue").Component;
}

/* lib/vite-modules.mjs: modules the browser loads by name (empty on the server) */
declare module "virtual:docs-examples/*" {
  export const files: Record<string, () => Promise<any>>;
}
declare module "virtual:docs-adapters/*" {
  export const files: Record<string, () => Promise<any>>;
}
declare module "virtual:docs-showcase" {
  export const files: Record<string, () => Promise<any>>;
}
