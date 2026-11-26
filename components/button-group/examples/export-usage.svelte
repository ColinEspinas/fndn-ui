<script lang="ts">
  import { ButtonGroup } from "@fndn/svelte";

  /* buttons from data: one handler gets the value of the button pressed */
  const formats = [
    { value: "csv", label: "CSV" },
    { value: "json", label: "JSON" },
    { value: "pdf", label: "PDF" },
  ];

  let file = $state("");
</script>

<div class="flex flex-col items-start gap-2">
  <ButtonGroup label="Export usage as" size="sm" items={formats} onitemclick={(format) => (file = `usage-nov-2026.${format}`)} />
  <p class="text-sm text-ink-2" role="status">{file ? `Preparing ${file}…` : "Usage for Nov 1 – Nov 14, 2026"}</p>
</div>
