<script setup lang="ts">
import { ref } from "vue";
import { Combobox } from "@fndn/vue";

const countries = ["Brazil", "Canada", "France", "Germany", "India", "Japan", "Netherlands", "United Kingdom", "United States"];
const vat = ["France", "Germany", "Netherlands"];

const country = ref<string | null>("Germany");
</script>

<template>
  <div class="flex flex-col gap-2" style="width: 260px">
    <Combobox :items="countries" v-model:value="country" label="Billing country" placeholder="Search countries" />
    <p class="m-0 text-sm text-ink-2">
      {{ country === null ? "Taxes are worked out from your country." : vat.includes(country) ? `VAT is added to invoices for ${country}.` : `No VAT is added for ${country}.` }}
    </p>
  </div>
</template>
