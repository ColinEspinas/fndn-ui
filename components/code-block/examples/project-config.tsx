import { CodeBlock } from "@fndn/react";

const code = [
  "import { defineConfig } from \"@northwind/sdk\";",
  "",
  "export default defineConfig({",
  "  project: \"web-app\",",
  "  framework: \"vite\",",
  "  buildCommand: \"pnpm build\",",
  "  outputDirectory: \"dist\",",
  "  regions: [\"fra1\", \"iad1\"],",
  "  environments: {",
  "    production: { branch: \"main\", domain: \"app.northwind.example\" },",
  "    staging: { branch: \"develop\" },",
  "    preview: { branches: [\"feat/*\", \"fix/*\"] },",
  "  },",
  "  headers: [",
  "    { source: \"/assets/(.*)\", cacheControl: \"public, max-age=31536000, immutable\" },",
  "  ],",
  "});",
].join("\n");

export default function ProjectConfig() {
  return <CodeBlock variant="code" filename="northwind.config.ts" value={code} maxHeight={200} />;
}
