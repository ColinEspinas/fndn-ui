import type { ComponentProps } from "react";
import { RecommendationCard } from "@fndn/react";

type Props = ComponentProps<typeof RecommendationCard>;

const options: Props["options"] = [
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

export default function SingleOption() {
  return (
    <RecommendationCard
      title="A custom domain certificate is about to expire"
      options={options}
    />
  );
}
