<script lang="ts">
  import { Accordion } from "@fndn/svelte";

  /* several open at once, caret first: a reader compares releases */
  const releases = [
    { value: "2.4.0", label: "2.4.0", meta: "Nov 14, 2026", detail: "Webhook deliveries retry up to five times with backoff. Usage alerts are in beta." },
    { value: "2.3.2", label: "2.3.2", meta: "Nov 3, 2026", detail: "Fixes preview URLs for branch names with a slash, like feat/usage-alerts." },
    { value: "2.3.0", label: "2.3.0", meta: "Oct 21, 2026", detail: "Adds the Staging environment and per-environment variables." },
  ];
  let open = $state(["2.4.0", "2.3.2"]);
</script>

<Accordion multiple caret="start" bind:value={open} items={releases} style="width: 360px" />
