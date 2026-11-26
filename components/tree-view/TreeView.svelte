<!-- A hierarchy of rows that open and close. Behaviour by Ark UI (Zag tree-view). -->
<script lang="ts">
  import { TreeView as ArkTreeView, createTreeCollection } from "@ark-ui/svelte/tree-view";
  import CaretRight from "phosphor-svelte/lib/CaretRightIcon";
  import type { Component } from "svelte";
  import { treeView } from "./tree-view.recipe";
  import { trackModality } from "../lib/modality";
  import { glideTree } from "./tree-view.logic";

  export type TreeViewNode = {
    value: string;
    /** The row's name (also what typeahead matches). */
    label: string;
    /** A node with children (even an empty list) is a branch. */
    children?: TreeViewNode[];
    disabled?: boolean;
    /** An icon before the name (a Phosphor icon component). */
    icon?: Component<any>;
  };

  type Props = {
    items: ReadonlyArray<TreeViewNode>;
    /** Two-way bindable: <TreeView bind:expandedValue />, the open branches. Omit for uncontrolled (defaultExpandedValue). */
    expandedValue?: string[];
    defaultExpandedValue?: string[];
    onexpandedvaluechange?: (value: string[]) => void;
    /** Two-way bindable: <TreeView bind:selectedValue />, the selected nodes. Omit for uncontrolled (defaultSelectedValue). */
    selectedValue?: string[];
    defaultSelectedValue?: string[];
    onselectedvaluechange?: (value: string[]) => void;
    /** multiple: Ctrl / Cmd + click and Shift + arrows add to the selection. */
    selectionMode?: "single" | "multiple";
    /** The tree's name, shown above it. Without one, pass aria-label. */
    label?: string;
    "aria-label"?: string;
    /** Row height on the control scale: xs 24 (dense side panes) · sm 28 · md 32 · lg 36. Dimensions only. */
    size?: "xs" | "sm" | "md" | "lg";
    class?: string;
    style?: string;
    /** data-* attributes land on the root (a host marks it as one of its parts). */
    [data: `data-${string}`]: string | undefined;
  };

  let {
    items, expandedValue = $bindable(), defaultExpandedValue, onexpandedvaluechange, selectedValue = $bindable(), defaultSelectedValue, onselectedvaluechange,
    selectionMode = "single", label, "aria-label": ariaLabel, size = "md", class: className, style, ...data
  }: Props = $props();

  const collection = $derived(
    createTreeCollection<TreeViewNode>({
      rootNode: { value: "", label: "", children: items as TreeViewNode[] },
      nodeToString: (n) => n.label,
    }),
  );
  const r = treeView();

  let tree = $state<HTMLElement | null>(null);
  let layer = $state<HTMLElement | null>(null);
  $effect(() => {
    trackModality();
    if (!tree || !layer) return;
    return glideTree(tree, layer);
  });
</script>

{#snippet icon(node: TreeViewNode)}
  {#if node.icon}{@const Icon = node.icon}<span data-slot="tree-view-icon" class={r.icon()} aria-hidden="true"><Icon /></span>{/if}
{/snippet}

{#snippet treeNode(node: TreeViewNode, indexPath: number[])}
  <ArkTreeView.NodeProvider {node} {indexPath}>
    {#if node.children}
      <ArkTreeView.Branch data-slot="tree-view-branch" class={r.branch()}>
        <ArkTreeView.BranchControl data-slot="tree-view-branch-control" class={r.branchControl()}>
          <ArkTreeView.BranchIndicator data-slot="tree-view-caret" class={r.caret()}><CaretRight data-slot="icon" weight="bold" /></ArkTreeView.BranchIndicator>
          {@render icon(node)}
          <ArkTreeView.BranchText data-slot="tree-view-text" class={r.text()}>{node.label}</ArkTreeView.BranchText>
        </ArkTreeView.BranchControl>
        <ArkTreeView.BranchContent data-slot="tree-view-content" class={r.content()}>
          <div data-slot="tree-view-body" class={r.body()}>
            <ArkTreeView.BranchIndentGuide data-slot="tree-view-guide" class={r.guide()} />
            {#each node.children as child, i (child.value)}{@render treeNode(child, [...indexPath, i])}{/each}
          </div>
        </ArkTreeView.BranchContent>
      </ArkTreeView.Branch>
    {:else}
      <ArkTreeView.Item data-slot="tree-view-item" class={r.item()}>
        {@render icon(node)}
        <ArkTreeView.ItemText data-slot="tree-view-text" class={r.text()}>{node.label}</ArkTreeView.ItemText>
      </ArkTreeView.Item>
    {/if}
  </ArkTreeView.NodeProvider>
{/snippet}

<ArkTreeView.Root
  {...data}
  data-slot="tree-view"
  class={r.base({ size, class: className })}
  {style}
  {collection}
  {expandedValue}
  {defaultExpandedValue}
  onExpandedChange={(d) => { expandedValue = d.expandedValue; onexpandedvaluechange?.(d.expandedValue); }}
  {selectedValue}
  {defaultSelectedValue}
  onSelectionChange={(d) => { selectedValue = d.selectedValue; onselectedvaluechange?.(d.selectedValue); }}
  {selectionMode}
  translations={ariaLabel ? { treeLabel: ariaLabel } : undefined}
>
  {#if label}<ArkTreeView.Label data-slot="tree-view-label" class={r.label()}>{label}</ArkTreeView.Label>{/if}
  <ArkTreeView.Tree bind:ref={tree} data-slot="tree-view-tree" class={r.tree()}>
    <div bind:this={layer} data-slot="tree-view-highlight" class={r.highlight()} aria-hidden="true"></div>
    {#each collection.rootNode.children ?? [] as node, i (node.value)}{@render treeNode(node, [i])}{/each}
  </ArkTreeView.Tree>
</ArkTreeView.Root>
