<script lang="ts">
  import File from "phosphor-svelte/lib/FileIcon";
  import FileText from "phosphor-svelte/lib/FileTextIcon";
  import Folder from "phosphor-svelte/lib/FolderIcon";
  import { TreeView, type TreeViewNode } from "@fndn/svelte";

  /* xs: the dense 24px rows of a code editor's side pane; sm 28 sits between, md 32 is the default */
  const folder = Folder;
  const file = File;
  const doc = FileText;

  const items: TreeViewNode[] = [
    {
      value: "src", label: "src", icon: folder,
      children: [
        {
          value: "src/webhooks", label: "webhooks", icon: folder,
          children: [
            { value: "src/webhooks/deliver.ts", label: "deliver.ts", icon: file },
            { value: "src/webhooks/retry-policy.ts", label: "retry-policy.ts", icon: file },
            { value: "src/webhooks/signature.ts", label: "signature.ts", icon: file },
          ],
        },
        { value: "src/invoices", label: "invoices", icon: folder, children: [{ value: "src/invoices/render-pdf.ts", label: "render-pdf.ts", icon: file }] },
        { value: "src/index.ts", label: "index.ts", icon: file },
      ],
    },
    { value: "tests", label: "tests", icon: folder, children: [{ value: "tests/deliver.test.ts", label: "deliver.test.ts", icon: file }] },
    { value: "package.json", label: "package.json", icon: file },
    { value: "README.md", label: "README.md", icon: doc },
  ];
</script>

<TreeView
  class="w-56"
  size="xs"
  label="billing-api"
  defaultExpandedValue={["src", "src/webhooks"]}
  defaultSelectedValue={["src/webhooks/retry-policy.ts"]}
  {items}
/>
