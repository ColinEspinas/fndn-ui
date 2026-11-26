<script lang="ts">
  import { RadioGroup } from "@fndn/svelte";

  /* exactly one of a short list, all visible at once */
  const visibility = [
    { value: "private", label: "Private: only members of web-app" },
    { value: "internal", label: "Internal: everyone at Northwind" },
    { value: "public", label: "Public: anyone with the link" },
  ];

  let value = $state("internal");
</script>

<RadioGroup bind:value name="visibility" label="Who can see web-app" items={visibility} />
