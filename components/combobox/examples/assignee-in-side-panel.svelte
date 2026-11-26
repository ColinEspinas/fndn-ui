<script lang="ts">
  import User from "phosphor-svelte/lib/UserIcon";
  import { Avatar, Combobox } from "@fndn/svelte";

  const members = [
    { value: "maya", label: "Maya Chen", meta: "Owner" },
    { value: "daniel", label: "Daniel Okafor", meta: "Admin" },
    { value: "priya", label: "Priya Raman", meta: "Member" },
    { value: "lucas", label: "Lucas Moreau", meta: "Member" },
    { value: "aiko", label: "Aiko Tanaka", meta: "Member" },
    { value: "jonas", label: "Jonas Weber", meta: "Member" },
  ];

  let assignee = $state<string | null>("priya");
  const person = $derived(members.find((member) => member.value === assignee));
</script>

<!-- a property row of an issue: ghost and without a caret it reads as text until touched;
     the start shows who is assigned (the name is already the field's text, so it is decorative) -->
<div class="flex items-center gap-2 text-sm" style="width: 280px">
  <span class="w-20 shrink-0 text-ink-2">Assignee</span>
  <Combobox
    items={members}
    bind:value={assignee}
    aria-label="Assignee"
    placeholder="Unassigned"
    emptyText="No one in Northwind matches"
    size="sm"
    variant="ghost"
    caret={false}
    class="flex-1"
  >
    {#snippet start()}
      {#if person}<Avatar name={person.label} size={16} aria-hidden="true" />{:else}<User data-slot="icon" weight="bold" />{/if}
    {/snippet}
  </Combobox>
</div>
