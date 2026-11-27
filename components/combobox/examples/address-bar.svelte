<script lang="ts">
  import Lock from "phosphor-svelte/lib/LockIcon";
  import Star from "phosphor-svelte/lib/StarIcon";
  import { Button, Combobox, Toggle } from "@fndn/svelte";

  const pages = [
    { value: "https://status.northwind.example", label: "status.northwind.example", meta: "Status · Northwind" },
    { value: "https://app.northwind.example/web-app/deploys", label: "app.northwind.example/web-app/deploys", meta: "Deploys · web-app" },
    { value: "https://app.northwind.example/billing-api/pull/482", label: "app.northwind.example/billing-api/pull/482", meta: "#482 Add retry to webhook delivery" },
  ];

  let address = $state<string | null>("https://app.northwind.example/web-app/deploys");
  let bookmarked = $state(false);
</script>

<!-- a browser's address bar: the site-information button in `start` (a button: it sits 2px from the
     edge, as the star does at the end), the bookmark star in `end` (a muted ghost Toggle:
     the filled star and the pressed fill when bookmarked); no caret, the suggestions open as you type -->
<Combobox
  items={pages}
  bind:value={address}
  aria-label="Address and search"
  placeholder="Search or enter address"
  variant="subtle"
  caret={false}
  style="width: 360px"
>
  {#snippet start()}
    <Button variant="ghost" size="xs" square muted aria-label="View site information">
      {#snippet icon()}<Lock data-slot="icon" weight="bold" />{/snippet}
    </Button>
  {/snippet}
  {#snippet end()}
    <Toggle
      bind:pressed={bookmarked}
      variant="ghost"
      size="xs"
      square
      muted
      tooltip={bookmarked ? "Edit bookmark" : "Bookmark this tab"}
    >
      {#snippet icon()}<Star data-slot="icon" weight={bookmarked ? "fill" : "bold"} />{/snippet}
    </Toggle>
  {/snippet}
</Combobox>
