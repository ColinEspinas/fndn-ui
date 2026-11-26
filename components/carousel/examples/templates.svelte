<script lang="ts">
  import { Carousel } from "@fndn/svelte";

  const templates = [
    { name: "Storefront", stack: "Next.js · Postgres", text: "Product pages, a cart and checkout, ready for your catalogue.", tint: "bg-accent-tint" },
    { name: "Docs site", stack: "Astro · MDX", text: "Versioned documentation with search and a changelog.", tint: "bg-green-tint" },
    { name: "Admin dashboard", stack: "SvelteKit · SQLite", text: "Tables, filters and sign-in for an internal tool.", tint: "bg-orange-tint" },
    { name: "API starter", stack: "Hono · Redis", text: "Typed routes, rate limiting and a health check.", tint: "bg-inset" },
  ];
</script>

<Carousel class="w-80 max-w-full" label="Templates" effect="depth" indicators items={templates.map((template) => ({ label: template.name }))}>
  {#snippet slide({ index })}
    <div class="flex h-full flex-col rounded-card bg-surface inset-ring inset-ring-line">
      <div class={`flex h-24 items-end px-6 pt-4 ${templates[index]!.tint}`}>
        <div class="flex h-full w-full flex-col gap-1.5 rounded-t-chip bg-surface p-2 shadow-hairline">
          <div class="h-1.5 w-10 rounded-pill bg-line-strong"></div>
          <div class="h-1.5 w-24 rounded-pill bg-line"></div>
          <div class="mt-auto h-6 rounded-chip bg-inset"></div>
        </div>
      </div>
      <div class="flex flex-col gap-0.5 p-4 text-sm">
        <p class="font-medium text-ink">{templates[index]!.name}</p>
        <p class="text-xs text-ink-2">{templates[index]!.stack}</p>
        <p class="mt-1 text-ink-2">{templates[index]!.text}</p>
      </div>
    </div>
  {/snippet}
</Carousel>
