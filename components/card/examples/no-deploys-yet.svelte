<script lang="ts">
  import { Button, Card, CardBody } from "@fndn/svelte";
</script>

<!-- inset: recessed into the page, for a placeholder that waits for content -->
<Card elevation="hairline" inset class="w-80 max-w-full">
  <CardBody class="flex flex-col items-center gap-3 py-6 text-center">
    <div>
      <p class="font-medium text-ink">No deploys yet</p>
      <p class="text-ink-2">docs-site has not been deployed. Push to main or deploy it now.</p>
    </div>
    <Button size="sm">Deploy now</Button>
  </CardBody>
</Card>
