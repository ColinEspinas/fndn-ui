<script lang="ts">
  import { CodeBlock } from "@fndn/svelte";

  const lines = [
    "await northwind.deploys.create({",
    "  project: \"web-app\",",
    "  target: \"production\",",
    "});",
  ];
</script>

<CodeBlock variant="code" filename="scripts/deploy.ts" {lines} />
