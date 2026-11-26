<script lang="ts">
  /* One Svelte example file inside Ark's LocaleProvider. */
  import { LocaleProvider } from "@ark-ui/svelte/locale";
  let { component: Component, locale = "en-US" }: { component: any; locale?: string } = $props();
</script>

<LocaleProvider {locale}>
  <Component />
</LocaleProvider>
