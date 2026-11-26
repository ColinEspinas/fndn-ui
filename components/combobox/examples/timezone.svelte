<script lang="ts">
  import { Combobox } from "@fndn/svelte";

  /* meta carries what tells similar options apart: here the offset */
  const zones = [
    { value: "America/Los_Angeles", label: "Los Angeles", meta: "UTC−08:00" },
    { value: "America/New_York", label: "New York", meta: "UTC−05:00" },
    { value: "America/Sao_Paulo", label: "São Paulo", meta: "UTC−03:00" },
    { value: "Europe/London", label: "London", meta: "UTC+00:00" },
    { value: "Europe/Berlin", label: "Berlin", meta: "UTC+01:00" },
    { value: "Asia/Kolkata", label: "Kolkata", meta: "UTC+05:30" },
    { value: "Asia/Tokyo", label: "Tokyo", meta: "UTC+09:00" },
    { value: "Australia/Sydney", label: "Sydney", meta: "UTC+11:00" },
  ];

  let zone = $state<string | null>("Europe/Berlin");
</script>

<Combobox items={zones} bind:value={zone} label="Timezone" placeholder="Search cities" style="width: 260px" />
