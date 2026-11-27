<script lang="ts">
  import { CodeView } from "@fndn/svelte";

  const log = [
    "$ pnpm build",
    "> web-app@2.14.0 build",
    "> vite build",
    "vite v6.2.0 building for production...",
    "transforming (412) src/routes/billing/invoices.tsx",
    "✓ 1,284 modules transformed.",
    "error during build:",
    "src/routes/billing/invoices.tsx (88:14): \"formatTotal\" is not exported by \"src/lib/money.ts\"",
    "  at getRollupError (node_modules/rollup/dist/es/shared/parseAst.js:397:41)",
    "ELIFECYCLE  Command failed with exit code 1.",
  ].join("\n");
</script>

<!-- a build log with the line that failed marked; the log scrolls past 160px -->
<CodeView label="Build log" value={log} currentLine={8} maxHeight={160} />
