<script lang="ts">
  import { Listbox } from "@fndn/svelte";

  /* every option stays in view; meta on the right, a disabled option says why */
  const regions = [
    { value: "iad1", label: "Washington, D.C. (iad1)", meta: "18 ms" },
    { value: "fra1", label: "Frankfurt (fra1)", meta: "96 ms" },
    { value: "gru1", label: "São Paulo (gru1)", meta: "Business plan", disabled: true },
  ];

  let region = $state(["iad1"]);
</script>

<Listbox items={regions} bind:value={region} label="Region" style="width: 280px" />
