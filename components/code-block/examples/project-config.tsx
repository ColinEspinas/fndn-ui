import type { ComponentProps } from "react";
import { CodeBlock } from "@fndn/react";

type Props = ComponentProps<typeof CodeBlock>;

const lines: Props["lines"] = [
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
];

export default function ProjectConfig() {
  return <CodeBlock variant="code" filename="northwind.config.ts" lines={lines} maxHeight={200} />;
}
