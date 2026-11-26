<script lang="ts">
  import { Avatar, Drawer, TextRow } from "@fndn/svelte";

  const members = [
    { name: "Maya Chen", email: "maya@northwind.example", role: "Owner", lastActive: "Now" },
    { name: "Daniel Okafor", email: "daniel@northwind.example", role: "Admin", lastActive: "2 hours ago" },
    { name: "Sofia Alvarez", email: "sofia@northwind.example", role: "Viewer", lastActive: "Nov 12, 2026" },
  ] as const;

  /* one drawer for the whole list: a row sets the member and opens it (open is controlled) */
  let open = $state(false);
  let member = $state<(typeof members)[number]>(members[0]);
  function show(m: (typeof members)[number]) {
    member = m;
    open = true;
  }
</script>

<ul class="flex w-80 flex-col">
  {#each members as m (m.email)}
    <li>
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-control px-2 py-1.5 text-start hover:bg-hover"
        onclick={() => show(m)}
      >
        <Avatar name={m.name} size={20} />
        <span class="flex-1 text-sm font-medium text-ink">{m.name}</span>
        <span class="text-xs text-ink-2">{m.role}</span>
      </button>
    </li>
  {/each}
</ul>
<Drawer bind:open side="end" title={member.name} description={member.email}>
  <TextRow label="Role" value={member.role} />
  <TextRow label="Last active" value={member.lastActive} />
  <TextRow label="Projects" value="web-app, billing-api" />
</Drawer>
