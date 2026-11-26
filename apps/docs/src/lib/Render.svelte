<script lang="ts">
  /* One component with JSON props inside Ark's LocaleProvider (lib/mount-svelte.ts). */
  import { LocaleProvider } from "@ark-ui/svelte/locale";
  let { component: Component, props = {}, text, locale = "en-US" }: { component: any; props?: Record<string, unknown>; text?: string; locale?: string } = $props();
  /* the props the component sees; update() merges a scenario step into them (no remount) */
  // svelte-ignore state_referenced_locally
  let current = $state<Record<string, unknown>>({ ...props });
  export function update(next: Record<string, unknown>) { current = { ...current, ...next }; }
</script>

<LocaleProvider {locale}>
  {#if text !== undefined}
    <Component {...current}>{text}</Component>
  {:else}
    <Component {...current} />
  {/if}
</LocaleProvider>
