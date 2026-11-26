import { Carousel } from "@fndn/react";

const quotes = [
  { quote: "Preview links on every pull request changed how we review design. Nobody asks for screenshots any more.", name: "Hana Ito", role: "Design lead, Fieldnote" },
  { quote: "Our deploys went from twenty minutes to two.", name: "Marcus Bell", role: "Staff engineer, Larkspur Health" },
  { quote: "We deleted four hundred lines of release scripts in the first week.", name: "Elena Petrova", role: "CTO, Tidewater" },
];

export default function CustomerQuotes() {
  return (
    <Carousel
      className="w-80 max-w-full"
      label="What teams say"
      effect="fade"
      indicators
      loop="endless"
      items={quotes.map((quote) => ({
        label: quote.name,
        content: (
          <figure className="flex h-full min-h-40 flex-col justify-between gap-4 bg-inset p-4 text-sm">
            <blockquote className="text-ink">“{quote.quote}”</blockquote>
            <figcaption className="text-xs text-ink-2">
              <span className="font-medium text-ink-2">{quote.name}</span> · {quote.role}
            </figcaption>
          </figure>
        ),
      }))}
    />
  );
}
