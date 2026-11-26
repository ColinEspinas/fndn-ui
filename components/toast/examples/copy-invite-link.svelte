<script lang="ts">
  import Link from "phosphor-svelte/lib/LinkIcon";
  import { Button, Toast, toast } from "@fndn/svelte";

  const copy = () => {
    void navigator.clipboard.writeText("https://northwind.example/join/8f2k1q");
    toast({ title: "Invite link copied", description: "Anyone with the link can join Northwind until Nov 24.", tone: "green" });
  };
</script>

<Button onclick={copy}>{#snippet icon()}<Link data-slot="icon" weight="bold" />{/snippet}Copy invite link</Button>
<!-- mount the region once, near the root of the app -->
<Toast />
