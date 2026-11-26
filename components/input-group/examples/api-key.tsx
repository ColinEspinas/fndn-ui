import { useState } from "react";
import { Button, InputGroup, Tooltip } from "@fndn/react";
import { Copy } from "@phosphor-icons/react";

/* a Button in an addon: ghost, xs, square, muted, named by its tooltip */
export default function ApiKey() {
  const [copied, setCopied] = useState(false);
  const key = "nw_live_4f9a2c71e0b8d3";
  return (
    <InputGroup
      readOnly
      mono
      value={key}
      aria-label="API key"
      className="w-full max-w-80"
      end={
        <Tooltip content={copied ? "Copied" : "Copy"}>
          <Button
            variant="ghost"
            size="xs"
            square
            muted
            aria-label="Copy API key"
            icon={<Copy data-slot="icon" weight="bold" />}
            onClick={() => { void navigator.clipboard?.writeText(key); setCopied(true); }}
          />
        </Tooltip>
      }
    />
  );
}
