<script lang="ts">
  import { Menu, type MenuEntry } from "@fndn/svelte";

  const environments = [
    { value: "production", label: "Production" },
    { value: "staging", label: "Staging" },
    { value: "preview", label: "Preview" },
  ];

  /* a pick is the whole job, so the menu closes on it (closeOnSelect) */
  let environment = $state("production");
  const items: MenuEntry[] = $derived([
    { type: "radio-group", name: "environment", label: "Show logs from", value: environment, closeOnSelect: true, items: environments },
  ]);
  const current = $derived(environments.find((e) => e.value === environment)?.label);
</script>

<Menu triggerLabel={current} {items} onradiochange={(_, value) => (environment = value)} />
