<script lang="ts">
  import { Button, Toast, toast } from "@fndn/svelte";

  const deploy = () => {
    const id = toast({ title: "Deploying web-app to Production…", loading: true, closable: false });
    setTimeout(() => toast.update(id, { title: "Deployed to Production", description: "dpl_7f3a9c is live at app.northwind.example.", tone: "green", loading: false, duration: 4000, closable: true }), 2000);
  };
</script>

<Button variant="primary" onclick={deploy}>Deploy to Production</Button>
<!-- mount the region once, near the root of the app -->
<Toast />
