import { useState } from "react";
import { Lock, Star } from "@phosphor-icons/react";
import { Button, Combobox, Toggle } from "@fndn/react";

const pages = [
  { value: "https://status.northwind.example", label: "status.northwind.example", meta: "Status · Northwind" },
  { value: "https://app.northwind.example/web-app/deploys", label: "app.northwind.example/web-app/deploys", meta: "Deploys · web-app" },
  { value: "https://app.northwind.example/billing-api/pull/482", label: "app.northwind.example/billing-api/pull/482", meta: "#482 Add retry to webhook delivery" },
];

/* a browser's address bar: the site-information button in `start` (a button: it sits 2px from the
 * edge, as the star does at the end), the bookmark star in `end` (an ink Toggle:
 * the accent star when bookmarked, never a grey box); no caret, the suggestions open as you type */
export default function AddressBar() {
  const [bookmarked, setBookmarked] = useState(false);
  return (
    <Combobox
      items={pages}
      defaultValue="https://app.northwind.example/web-app/deploys"
      aria-label="Address and search"
      placeholder="Search or enter address"
      variant="subtle"
      caret={false}
      start={<Button variant="ghost" size="xs" square muted aria-label="View site information" icon={<Lock data-slot="icon" weight="bold" />} />}
      end={
        <Toggle
          variant="ink"
          size="xs"
          square
          className="aria-pressed:text-accent"
          tooltip={bookmarked ? "Edit bookmark" : "Bookmark this tab"}
          pressed={bookmarked}
          onPressedChange={setBookmarked}
          icon={<Star data-slot="icon" weight={bookmarked ? "fill" : "bold"} />}
        />
      }
      style={{ width: 360 }}
    />
  );
}
