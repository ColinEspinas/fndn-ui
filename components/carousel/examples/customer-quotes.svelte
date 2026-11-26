<script lang="ts">
  import { Carousel } from "@fndn/svelte";

  const quotes = [
    { quote: "Preview links on every pull request changed how we review design. Nobody asks for screenshots any more.", name: "Hana Ito", role: "Design lead, Fieldnote" },
    { quote: "Our deploys went from twenty minutes to two.", name: "Marcus Bell", role: "Staff engineer, Larkspur Health" },
    { quote: "We deleted four hundred lines of release scripts in the first week.", name: "Elena Petrova", role: "CTO, Tidewater" },
  ];
</script>

<Carousel class="w-80 max-w-full" label="What teams say" effect="fade" indicators loop="endless" items={quotes.map((quote) => ({ label: quote.name }))}>
  {#snippet slide({ index })}
    <figure class="flex h-full min-h-40 flex-col justify-between gap-4 bg-inset p-4 text-sm">
      <blockquote class="text-ink">“{quotes[index]!.quote}”</blockquote>
      <figcaption class="text-xs text-ink-2">
        <span class="font-medium text-ink-2">{quotes[index]!.name}</span> · {quotes[index]!.role}
      </figcaption>
    </figure>
  {/snippet}
</Carousel>
