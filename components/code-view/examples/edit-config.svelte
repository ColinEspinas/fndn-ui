<script lang="ts">
  import { CodeView } from "@fndn/svelte";

  let code = $state([
    "export default {",
    "  project: \"web-app\",",
    "  regions: [\"fra1\", \"iad1\"],",
    "  buildCommand: \"pnpm build\",",
    "};",
  ].join("\n"));
</script>

<CodeView bind:value={code} editable label="northwind.config.ts" />
