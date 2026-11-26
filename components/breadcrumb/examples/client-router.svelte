<script lang="ts">
  import { Breadcrumb, Button } from "@fndn/svelte";

  const pages = [
    { label: "Northwind", href: "/northwind" },
    { label: "mobile", href: "/northwind/mobile" },
    { label: "Deploys", href: "/northwind/mobile/deploys" },
    { label: "dpl_2c81e4", href: "/northwind/mobile/deploys/dpl_2c81e4" },
  ];

  /* onnavigate takes over plain clicks (Cmd/Ctrl-click still opens a tab): hand them to your router */
  let depth = $state(pages.length);
  const trail = $derived(pages.slice(0, depth).map((page, i) => (i === depth - 1 ? { label: page.label } : page)));
  const child = $derived(pages[depth]);
</script>

<div class="flex w-80 flex-col items-start gap-3">
  <Breadcrumb
    items={trail}
    onnavigate={(href) => (depth = pages.findIndex((page) => page.href === href) + 1)}
  />
  {#if child}
    <Button size="sm" onclick={() => (depth = depth + 1)}>Open {child.label}</Button>
  {/if}
</div>
