import { Carousel } from "@fndn/react";

const announcements = [
  { title: "Scheduled maintenance", text: "Builds pause on Sunday, Nov 29, from 02:00 to 02:30 UTC.", tint: "bg-orange-tint" },
  { title: "Usage-based billing is live", text: "Team plans now pay for build minutes past 6,000 a month.", tint: "bg-accent-tint" },
  { title: "New region: São Paulo", text: "Deploy web-app closer to your users in South America.", tint: "bg-green-tint" },
];

export default function Announcements() {
  return (
    <Carousel
      className="w-80 max-w-full"
      label="Announcements"
      autoplay={6000}
      loop="endless"
      indicators
      items={announcements.map((announcement) => ({
        label: announcement.title,
        content: (
          <div className={`flex h-24 flex-col justify-end gap-1 p-4 text-sm ${announcement.tint}`}>
            <p className="font-medium text-ink">{announcement.title}</p>
            <p className="text-ink-2">{announcement.text}</p>
          </div>
        ),
      }))}
    />
  );
}
