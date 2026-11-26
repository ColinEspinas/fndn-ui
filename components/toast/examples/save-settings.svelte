<script lang="ts">
  import { Button, Toast, toast } from "@fndn/svelte";

  const save = () => {
    toast({ title: "Changes saved", description: "web-app now builds with pnpm build." });
  };
</script>

<Button onclick={save}>Save changes</Button>
<!-- mount the region once, near the root of the app -->
<Toast />
