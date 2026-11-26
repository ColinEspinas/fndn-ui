<script lang="ts">
  import File from "phosphor-svelte/lib/FileIcon";
  import Folder from "phosphor-svelte/lib/FolderIcon";
  import { TreeView, type TreeViewNode } from "@fndn/svelte";

  const folder = Folder;
  const file = File;

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
</script>

<TreeView
  class="w-64"
  aria-label="billing-api files"
  defaultExpandedValue={["src"]}
  defaultSelectedValue={["src/webhooks"]}
  {items}
/>
