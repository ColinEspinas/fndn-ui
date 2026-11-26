<script lang="ts">
  import { SidebarNav, type SidebarNavItem } from "@fndn/svelte";

  const workspaces = [
    { value: "harbor", label: "Harbor" },
    { value: "harbor-eu", label: "Harbor EU" },
    { value: "sandbox", label: "Maya's sandbox" },
  ];

  const items: SidebarNavItem[] = [
    { value: "new", label: "New chat", href: "#new", icon: "note-pencil" },
    { value: "home", label: "Home", href: "#home", icon: "house" },
    {
      value: "invite",
      label: "Invite teammates",
      href: "#invite",
      icon: "user-plus",
      badge: "3/10",
    },
  ];

  const chats = [
    { value: "deploy", label: "Failed deploy on harbor/api", href: "#deploy" },
    { value: "refund", label: "Refund for Brightline Dental", href: "#refund" },
  ];

  let workspace = $state("harbor");

  let current = $state("home");

  let collapsed = $state(true);
</script>

<!-- the rail against the app it belongs to: the content pane starts at its hairline -->
<div class="flex h-[360px] w-[600px] max-w-full">
  <SidebarNav
    bind:workspace={workspace}
    workspaces={workspaces}
    logo="calendar"
    items={items}
    chats={chats}
    bind:current={current}
    bind:collapsed={collapsed}
  />
  <main class="flex min-w-0 flex-1 flex-col gap-1 border-s border-line ps-6 pt-2">
    <h2 class="text-md font-medium text-ink">Good morning, Maya</h2>
    <p class="text-sm text-ink-2">The rail keeps every link one press away.</p>
  </main>
</div>
