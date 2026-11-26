<script lang="ts">
  import { TagsInput } from "@fndn/svelte";

  let emails = $state<string[]>(["priya@northwind.example", "lucas@northwind"]);
  const invalid = $derived(emails.some((email) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)));
</script>

<!-- controlled: paste a list of addresses, check each one -->
<div class="flex flex-col gap-2" style="width: 320px">
  <TagsInput bind:value={emails} label="Invite by email" {invalid} placeholder="name@northwind.example" />
  <span class="text-sm text-ink-2">
    {invalid ? "Every address needs a domain, like .example." : `${emails.length} ${emails.length === 1 ? "invite" : "invites"} will be sent.`}
  </span>
</div>
