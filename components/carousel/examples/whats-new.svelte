<script lang="ts">
  import { Carousel } from "@fndn/svelte";

  const features = [
    { title: "Usage alerts", text: "Get an email when a project reaches 80% of its build minutes.", tint: "bg-accent-tint" },
    { title: "Webhook retries", text: "Failed deliveries now retry five times with exponential backoff.", tint: "bg-green-tint" },
    { title: "Preview comments", text: "Every pull request gets its preview URL as a comment.", tint: "bg-orange-tint" },
    { title: "Single sign-on", text: "Business workspaces can sign in with their identity provider.", tint: "bg-inset" },
  ];
</script>

<Carousel class="w-80 max-w-full" label="What’s new" indicators items={features.map((feature) => ({ label: feature.title }))}>
  {#snippet slide({ index })}
    <div class={`flex h-24 flex-col justify-end gap-1 p-4 text-sm ${features[index]!.tint}`}>
      <p class="font-medium text-ink">{features[index]!.title}</p>
      <p class="text-ink-2">{features[index]!.text}</p>
    </div>
  {/snippet}
</Carousel>
