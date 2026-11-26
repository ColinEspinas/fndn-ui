import { Carousel } from "@fndn/react";

const features = [
  { title: "Usage alerts", text: "Get an email when a project reaches 80% of its build minutes.", tint: "bg-accent-tint" },
  { title: "Webhook retries", text: "Failed deliveries now retry five times with exponential backoff.", tint: "bg-green-tint" },
  { title: "Preview comments", text: "Every pull request gets its preview URL as a comment.", tint: "bg-orange-tint" },
  { title: "Single sign-on", text: "Business workspaces can sign in with their identity provider.", tint: "bg-inset" },
];

export default function WhatsNew() {
  return (
    <Carousel
      className="w-80 max-w-full"
      label="What’s new"
      indicators
      items={features.map((feature) => ({
        label: feature.title,
        content: (
          <div className={`flex h-24 flex-col justify-end gap-1 p-4 text-sm ${feature.tint}`}>
            <p className="font-medium text-ink">{feature.title}</p>
            <p className="text-ink-2">{feature.text}</p>
          </div>
        ),
      }))}
    />
  );
}
