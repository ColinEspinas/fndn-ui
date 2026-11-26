<script lang="ts">
  import { Card, CardBody, CardHeader, CardTitle, StatusPill, TextRow } from "@fndn/svelte";
</script>

<Card class="w-80 max-w-full">
  <CardHeader>
    <CardTitle>billing-api</CardTitle>
  </CardHeader>
  <CardBody>
    <TextRow label="Status">
      {#snippet value()}<StatusPill tone="green" size="sm">Healthy</StatusPill>{/snippet}
    </TextRow>
    <TextRow label="Region" value="Frankfurt" meta="eu-central-1" />
    <TextRow label="Runtime" value="Node 22" />
    <TextRow label="Created" value="Mar 3, 2026" />
  </CardBody>
</Card>
