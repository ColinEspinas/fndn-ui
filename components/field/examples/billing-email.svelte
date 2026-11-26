<script lang="ts">
  import { Field, Input } from "@fndn/svelte";

  let email = $state("billing@northwind.example");
</script>

<!-- the field wires the label (for / id) and the helper (aria-describedby) to the control -->
<Field label="Billing email" helper="Invoices and receipts are sent here." class="w-full max-w-80">
  <Input bind:value={email} type="email" autocomplete="email" />
</Field>
