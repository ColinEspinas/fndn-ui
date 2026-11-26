import { useState } from "react";
import { TextB, TextItalic, TextUnderline } from "@phosphor-icons/react";
import { ToggleGroup } from "@fndn/react";

/* several at once: bold, italic and underline apply together */
const styles = [
  { value: "bold", label: "Bold", icon: <TextB data-slot="icon" weight="bold" /> },
  { value: "italic", label: "Italic", icon: <TextItalic data-slot="icon" weight="bold" /> },
  { value: "underline", label: "Underline", icon: <TextUnderline data-slot="icon" weight="bold" /> },
];

export default function TextFormatting() {
  const [format, setFormat] = useState<string[]>(["bold"]);
  return (
    <div className="flex w-80 flex-col gap-3">
      <ToggleGroup aria-label="Text style" multiple size="sm" value={format} onValueChange={setFormat} items={styles} />
      <p
        className="text-sm text-ink-2"
        style={{
          fontWeight: format.includes("bold") ? 600 : undefined,
          fontStyle: format.includes("italic") ? "italic" : undefined,
          textDecoration: format.includes("underline") ? "underline" : undefined,
        }}
      >
        Webhook deliveries now retry for up to 24 hours.
      </p>
    </div>
  );
}
