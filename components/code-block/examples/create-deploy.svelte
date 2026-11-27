<script lang="ts">
  import { CodeBlock } from "@fndn/svelte";

  const code = [
    "await northwind.deploys.create({",
    "  project: \"web-app\",",
    "  target: \"production\",",
    "});",
  ].join("\n");
</script>

<CodeBlock variant="code" filename="scripts/deploy.ts" value={code} />
