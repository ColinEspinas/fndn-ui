import { File, Folder } from "@phosphor-icons/react";
import { TreeView, type TreeViewNode } from "@fndn/react";

const folder = <Folder />;
const file = <File />;

const items: TreeViewNode[] = [
  {
    value: "src", label: "src", icon: folder,
    children: [
      {
        value: "src/webhooks", label: "webhooks", icon: folder,
        children: [
          { value: "src/webhooks/deliver.ts", label: "deliver.ts", icon: file },
          { value: "src/webhooks/retry-policy.ts", label: "retry-policy.ts", icon: file },
        ],
      },
      {
        value: "src/invoices", label: "invoices", icon: folder,
        children: [{ value: "src/invoices/render-pdf.ts", label: "render-pdf.ts", icon: file }],
      },
    ],
  },
  { value: "package.json", label: "package.json", icon: file },
];

export default function RepositoryFiles() {
  return (
    <TreeView
      className="w-64"
      aria-label="billing-api files"
      defaultExpandedValue={["src"]}
      defaultSelectedValue={["src/webhooks"]}
      items={items}
    />
  );
}
