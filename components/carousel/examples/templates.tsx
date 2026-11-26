import { Carousel } from "@fndn/react";

const templates = [
  { name: "Storefront", stack: "Next.js · Postgres", text: "Product pages, a cart and checkout, ready for your catalogue.", tint: "bg-accent-tint" },
  { name: "Docs site", stack: "Astro · MDX", text: "Versioned documentation with search and a changelog.", tint: "bg-green-tint" },
  { name: "Admin dashboard", stack: "SvelteKit · SQLite", text: "Tables, filters and sign-in for an internal tool.", tint: "bg-orange-tint" },
  { name: "API starter", stack: "Hono · Redis", text: "Typed routes, rate limiting and a health check.", tint: "bg-inset" },
];

export default function Templates() {
  return (
    <Carousel
      className="w-80 max-w-full"
      label="Templates"
      effect="depth"
      indicators
      items={templates.map((template) => ({
        label: template.name,
        content: (
          <div className="flex h-full flex-col rounded-card bg-surface inset-ring inset-ring-line">
            <div className={`flex h-24 items-end px-6 pt-4 ${template.tint}`}>
              <div className="flex h-full w-full flex-col gap-1.5 rounded-t-chip bg-surface p-2 shadow-hairline">
                <div className="h-1.5 w-10 rounded-pill bg-line-strong" />
                <div className="h-1.5 w-24 rounded-pill bg-line" />
                <div className="mt-auto h-6 rounded-chip bg-inset" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5 p-4 text-sm">
              <p className="font-medium text-ink">{template.name}</p>
              <p className="text-xs text-ink-2">{template.stack}</p>
              <p className="mt-1 text-ink-2">{template.text}</p>
            </div>
          </div>
        ),
      }))}
    />
  );
}
