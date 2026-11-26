<script lang="ts">
  import Plus from "phosphor-svelte/lib/PlusIcon";
  import { Button, Tabs, type TabsItem } from "@fndn/svelte";

  const items: TabsItem[] = [
    { value: "variables", label: "Variables", content: "12 variables: 8 in every environment, 4 in Production only." },
    { value: "domains", label: "Domains", content: "app.northwind.example and 2 preview domains." },
  ];

  let value = $state("variables");
</script>

<!-- the end snippet sits at the far end of the tab row: the action for the section -->
<Tabs bind:value class="w-80" {items} aria-label="Environment">
  {#snippet end()}
    <Button size="sm" variant="ghost" class="ms-auto">
      {#snippet icon()}<Plus data-slot="icon" weight="bold" />{/snippet}
      Add
    </Button>
  {/snippet}
</Tabs>
