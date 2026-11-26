<script lang="ts">
  import { Input, Label } from "@fndn/svelte";
</script>

<!-- when most fields are required, mark the few optional ones instead of every required one -->
<div class="flex w-full max-w-80 flex-col gap-1.5">
  <Label for="vat-number">
    VAT number <span class="font-normal text-ink-2">(optional)</span>
  </Label>
  <Input id="vat-number" mono placeholder="DE123456789" />
</div>
