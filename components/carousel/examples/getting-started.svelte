<script lang="ts">
  import { Button, Carousel } from "@fndn/svelte";

  const steps = [
    "Connect the northwind/web-app repository",
    "Pick the branch that deploys to Production",
    "Add the environment variables from your .env file",
    "Deploy, and get a URL for every pull request",
  ];
  let page = $state(0);
</script>

<div class="flex w-full max-w-sm flex-col items-start gap-2">
  <Carousel bind:page label="Getting started" items={steps} />
  <Button size="sm" variant="ghost" disabled={page === steps.length - 1} onclick={() => (page = steps.length - 1)}>Skip to deploy</Button>
</div>
