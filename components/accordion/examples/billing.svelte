<script lang="ts">
  import { Accordion, Button } from "@fndn/svelte";

  /* free content after an item's detail: the actions of that section */
  let open = $state(["plan"]);
  const items = [
    { value: "plan", label: "Plan", meta: "Team", detail: "12 of 20 seats in use. Renews on Dec 1, 2026 at $240.00." },
    { value: "payment", label: "Payment method", meta: "Card ending 4242", detail: "Expires 08/2028. Receipts go to maya@northwind.example." },
  ];
</script>

<Accordion variant="card" bind:value={open} style="width: 360px" {items}>
  {#snippet content(item)}
    {#if item.value === "plan"}
      <div class="flex gap-2 px-2.5 pb-2.5">
        <Button size="sm">Change plan</Button>
        <Button size="sm" variant="ghost">View invoices</Button>
      </div>
    {:else}
      <div class="flex gap-2 px-2.5 pb-2.5">
        <Button size="sm">Update card</Button>
      </div>
    {/if}
  {/snippet}
</Accordion>
