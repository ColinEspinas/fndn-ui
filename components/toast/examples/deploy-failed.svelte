<script lang="ts">
  import { Button, Toast, toast } from "@fndn/svelte";

  const retry = () => {
    const id = toast({ title: "Redeploying billing-api to Staging…", loading: true, closable: false });
    setTimeout(() => toast.update(id, { title: "Deployed billing-api to Staging", tone: "green", loading: false, duration: 4000, closable: true }), 2000);
  };
  const deploy = () => {
    toast({ title: "Deploy to Staging failed", description: "The build of billing-api exited with code 1.", tone: "red", duration: 0, action: { label: "Retry", onClick: retry } });
  };
</script>

<Button onclick={deploy}>Deploy to Staging</Button>
<!-- mount the region once, near the root of the app -->
<Toast />
