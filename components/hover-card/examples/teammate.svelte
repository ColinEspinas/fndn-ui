<script lang="ts">
  import { Avatar, HoverCard } from "@fndn/svelte";

  const person = {
    name: "Priya Raman",
    role: "Staff engineer, Platform",
    email: "priya@northwind.example",
    localTime: "16:42 in Berlin",
  };
</script>

<div class="flex flex-wrap items-center gap-x-1 text-sm text-ink-2">
  <span>Approved by</span>
  <HoverCard placement="top-start">
    {#snippet trigger(props)}
      <button {...props()} type="button" class="font-medium text-ink underline decoration-line-strong underline-offset-2">{person.name}</button>
    {/snippet}
    <div class="flex items-start gap-3">
      <Avatar name={person.name} size={20} />
      <div class="flex flex-col gap-0.5">
        <span class="font-medium text-ink">{person.name}</span>
        <span class="text-ink-2">{person.role}</span>
        <span class="text-ink-2">{person.email} · {person.localTime}</span>
      </div>
    </div>
  </HoverCard>
  <span>· 2 min ago</span>
</div>
