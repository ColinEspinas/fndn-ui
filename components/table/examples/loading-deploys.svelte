<script lang="ts">
  import { Table } from "@fndn/svelte";

  const columns = [
    { key: "branch", label: "Branch", truncate: true },
    { key: "status", label: "Status" },
    { key: "duration", label: "Duration", numeric: true },
  ];
</script>

<!-- while the deploys load: the header and as many still placeholder rows as the page usually shows -->
<Table variant="flush" aria-label="Recent deploys of web-app" {columns} rows={[]} loading loadingRows={3} />
