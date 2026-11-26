<script lang="ts">
  import { RecommendationCard, type RecommendationOption } from "@fndn/svelte";

  const options: RecommendationOption[] = [
    {
      key: "renew",
      body: [
        "Renew the certificate for ",
        { entity: "book.brightlinedental.com" },
        " now; it expires in ",
        { value: "6 days", tone: "red" },
        ".",
      ],
      short: "Renew the certificate now",
      signal: 3,
      tone: "green",
      label: "High confidence",
      cta: "Renew",
      ctaVariant: "accent",
    },
  ];
</script>

<RecommendationCard
  title="A custom domain certificate is about to expire"
  options={options}
/>
