<script lang="ts">
  import { Button, Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle, TextRow } from "@fndn/svelte";

  const usage = [
    { label: "Seats", value: "12", meta: "of 20" },
    { label: "Build minutes", value: "4,120", meta: "of 6,000" },
    { label: "Bandwidth", value: "182 GB", meta: "of 1 TB" },
  ];
</script>

<Card class="w-80 max-w-full">
  <CardHeader>
    <div>
      <CardTitle>Team plan</CardTitle>
      <CardDescription>$240.00 a month · renews Dec 1, 2026</CardDescription>
    </div>
  </CardHeader>
  <CardBody>
    {#each usage as row (row.label)}
      <TextRow label={row.label} value={row.value} meta={row.meta} />
    {/each}
  </CardBody>
  <CardFooter>
    <Button variant="primary" size="sm">Upgrade to Business</Button>
    <Button variant="ghost" size="sm">Compare plans</Button>
  </CardFooter>
</Card>
