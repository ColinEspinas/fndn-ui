<script lang="ts">
  import { Carousel } from "@fndn/svelte";

  const announcements = [
    { title: "Scheduled maintenance", text: "Builds pause on Sunday, Nov 29, from 02:00 to 02:30 UTC.", tint: "bg-orange-tint" },
    { title: "Usage-based billing is live", text: "Team plans now pay for build minutes past 6,000 a month.", tint: "bg-accent-tint" },
    { title: "New region: São Paulo", text: "Deploy web-app closer to your users in South America.", tint: "bg-green-tint" },
  ];
</script>

<Carousel class="w-80 max-w-full" label="Announcements" autoplay={6000} loop="endless" indicators items={announcements.map((announcement) => ({ label: announcement.title }))}>
  {#snippet slide({ index })}
    <div class={`flex h-24 flex-col justify-end gap-1 p-4 text-sm ${announcements[index]!.tint}`}>
      <p class="font-medium text-ink">{announcements[index]!.title}</p>
      <p class="text-ink-2">{announcements[index]!.text}</p>
    </div>
  {/snippet}
</Carousel>
