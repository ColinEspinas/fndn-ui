import { useState } from "react";
import { Tag } from "@fndn/react";

/* pill tags in a pill-shaped host (a comment box), with a tooltip on the remove button */
export default function Attachments() {
  const [files, setFiles] = useState(["deploy-log.txt", "checkout-error.png"]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {files.map((file) => (
        <Tag key={file} shape="pill" removable removeLabel={`Remove ${file}`} removeTooltip="Remove" onRemove={() => setFiles(files.filter((f) => f !== file))}>
          {file}
        </Tag>
      ))}
    </div>
  );
}
