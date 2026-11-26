<script lang="ts">
  import { Combobox } from "@fndn/svelte";

  const countries = ["Brazil", "Canada", "France", "Germany", "India", "Japan", "Netherlands", "United Kingdom", "United States"];
  const vat = ["France", "Germany", "Netherlands"];

  let country = $state<string | null>("Germany");
</script>

<div class="flex flex-col gap-2" style="width: 260px">
  <Combobox items={countries} bind:value={country} label="Billing country" placeholder="Search countries" />
  <p class="m-0 text-sm text-ink-2">
    {country === null ? "Taxes are worked out from your country." : vat.includes(country) ? `VAT is added to invoices for ${country}.` : `No VAT is added for ${country}.`}
  </p>
</div>
