<script lang="ts">
  import { NavigationMenu, type NavigationMenuItem } from "@fndn/svelte";

  /* onlinkselect hears every followed link: keep the current page in state and mark it */
  let page = $state("#deploys");
  const items: NavigationMenuItem[] = $derived([
    { value: "overview", label: "Overview", href: "#overview", current: page === "#overview" },
    { value: "deploys", label: "Deploys", href: "#deploys", current: page === "#deploys" },
    {
      value: "observability",
      label: "Observability",
      links: [
        { label: "Logs", href: "#logs", current: page === "#logs" },
        { label: "Usage", href: "#usage", current: page === "#usage" },
      ],
    },
  ]);
</script>

<NavigationMenu label="billing-api" {items} onlinkselect={(href) => (page = href)} />
