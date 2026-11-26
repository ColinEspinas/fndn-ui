<script lang="ts">
  import File from "phosphor-svelte/lib/FileIcon";
  import FileText from "phosphor-svelte/lib/FileTextIcon";
  import Gear from "phosphor-svelte/lib/GearIcon";
  import { Combobox, type ComboboxItem } from "@fndn/svelte";

  /* an editor's "Go to file": each file leads with its icon, its folder after it; as you type, the
   * part of each name you typed stays in ink and the rest dims, so you see why a file is listed */
  const files: ComboboxItem[] = [
    { value: "src/middleware/rate-limit.ts", label: "rate-limit.ts", meta: "src/middleware", icon: File },
    { value: "src/middleware/rate-limit.test.ts", label: "rate-limit.test.ts", meta: "src/middleware", icon: File },
    { value: "src/webhooks/retry-policy.ts", label: "retry-policy.ts", meta: "src/webhooks", icon: File },
    { value: "docs/rate-limits.md", label: "rate-limits.md", meta: "docs", icon: FileText },
    { value: "config/limits.yaml", label: "limits.yaml", meta: "config", icon: Gear },
  ];

  let file = $state<string | null>(null);
</script>

<Combobox items={files} bind:value={file} highlightMatch aria-label="Go to file" placeholder="Go to file" emptyText="No file matches" style="width: 320px" />
