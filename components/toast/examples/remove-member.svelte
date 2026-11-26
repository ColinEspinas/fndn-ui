<script lang="ts">
  import { Button, Toast, toast } from "@fndn/svelte";

  const remove = () => {
    toast({ title: "Lucas Moreau was removed from Northwind", action: { label: "Undo", onClick: () => toast({ title: "Lucas Moreau is back in Northwind", tone: "green" }) } });
  };
</script>

<Button variant="danger" onclick={remove}>Remove Lucas Moreau</Button>
<!-- mount the region once, near the root of the app -->
<Toast />
