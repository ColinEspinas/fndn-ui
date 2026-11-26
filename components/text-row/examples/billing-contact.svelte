<script lang="ts">
  import { TextRow } from "@fndn/svelte";
</script>

<!-- a long label wraps; the value keeps its column and is never cut -->
<div class="flex w-80 flex-col">
  <TextRow label="Billing email" value="billing@northwind.example" />
  <TextRow label="Tax ID for invoices issued to the Northwind workspace" value="DE 811 907 435" />
</div>
