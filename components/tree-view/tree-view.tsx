"use client";
import { TreeView as ArkTreeView, createTreeCollection } from "@ark-ui/react/tree-view";
import { CaretRight } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { treeView } from "./tree-view.recipe";
import { trackModality } from "../lib/modality";
import { glideTree } from "./tree-view.logic";

export type TreeViewNode = {
  value: string;
  /** The row's name (a node in React; a string keeps typeahead working). */
  label: ReactNode;
  /** A node with children (even an empty list) is a branch. */
  children?: TreeViewNode[];
  disabled?: boolean;
  /** An icon before the name (a Phosphor icon). */
  icon?: ReactNode;
};

export type TreeViewProps = {
  items: ReadonlyArray<TreeViewNode>;
  /** Controlled: the open branches. Omit for uncontrolled (defaultExpandedValue). */
  expandedValue?: string[];
  defaultExpandedValue?: string[];
  onExpandedValueChange?: (value: string[]) => void;
  /** Controlled: the selected nodes. Omit for uncontrolled (defaultSelectedValue). */
  selectedValue?: string[];
  defaultSelectedValue?: string[];
  onSelectedValueChange?: (value: string[]) => void;
  /** multiple: Ctrl / Cmd + click and Shift + arrows add to the selection. */
  selectionMode?: "single" | "multiple";
  /** The tree's name, shown above it. Without one, pass aria-label. */
  label?: string;
  "aria-label"?: string;
  /** Row height on the control scale: xs 24 (dense side panes) · sm 28 · md 32 · lg 36. Dimensions only. */
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  style?: CSSProperties;
  /** data-* attributes land on the root (a host marks it as one of its parts). */
  [data: `data-${string}`]: string | undefined;
};

type Node = TreeViewNode & { children?: Node[] };
const r = treeView();

function TreeNode({ node, indexPath }: { node: Node; indexPath: number[] }) {
  return (
    <ArkTreeView.NodeProvider node={node} indexPath={indexPath}>
      {node.children ? (
        <ArkTreeView.Branch data-slot="tree-view-branch" className={r.branch()}>
          <ArkTreeView.BranchControl data-slot="tree-view-branch-control" className={r.branchControl()}>
            <ArkTreeView.BranchIndicator data-slot="tree-view-caret" className={r.caret()}><CaretRight data-slot="icon" weight="bold" /></ArkTreeView.BranchIndicator>
            {node.icon != null && <span data-slot="tree-view-icon" className={r.icon()} aria-hidden>{node.icon}</span>}
            <ArkTreeView.BranchText data-slot="tree-view-text" className={r.text()}>{node.label}</ArkTreeView.BranchText>
          </ArkTreeView.BranchControl>
          <ArkTreeView.BranchContent data-slot="tree-view-content" className={r.content()}>
            <div data-slot="tree-view-body" className={r.body()}>
              <ArkTreeView.BranchIndentGuide data-slot="tree-view-guide" className={r.guide()} />
              {node.children.map((child, i) => <TreeNode key={child.value} node={child} indexPath={[...indexPath, i]} />)}
            </div>
          </ArkTreeView.BranchContent>
        </ArkTreeView.Branch>
      ) : (
        <ArkTreeView.Item data-slot="tree-view-item" className={r.item()}>
          {node.icon != null && <span data-slot="tree-view-icon" className={r.icon()} aria-hidden>{node.icon}</span>}
          <ArkTreeView.ItemText data-slot="tree-view-text" className={r.text()}>{node.label}</ArkTreeView.ItemText>
        </ArkTreeView.Item>
      )}
    </ArkTreeView.NodeProvider>
  );
}

/** A hierarchy of rows that open and close. Behaviour by Ark UI (Zag tree-view). */
export function TreeView({
  items, expandedValue, defaultExpandedValue, onExpandedValueChange, selectedValue, defaultSelectedValue, onSelectedValueChange,
  selectionMode = "single", label, "aria-label": ariaLabel, size = "md", className, style, ...data
}: TreeViewProps) {
  const collection = useMemo(
    () => createTreeCollection<Node>({
      rootNode: { value: "", label: "", children: items as Node[] },
      nodeToString: (n) => (typeof n.label === "string" ? n.label : n.value),
    }),
    [items],
  );
  const tree = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    trackModality();
    if (!tree.current || !layer.current) return;
    return glideTree(tree.current, layer.current);
  }, []);
  return (
    <ArkTreeView.Root
      {...data}
      data-slot="tree-view"
      className={r.base({ size, class: className })}
      style={style}
      collection={collection}
      expandedValue={expandedValue}
      defaultExpandedValue={defaultExpandedValue}
      onExpandedChange={(d) => onExpandedValueChange?.(d.expandedValue)}
      selectedValue={selectedValue}
      defaultSelectedValue={defaultSelectedValue}
      onSelectionChange={(d) => onSelectedValueChange?.(d.selectedValue)}
      selectionMode={selectionMode}
      translations={ariaLabel ? { treeLabel: ariaLabel } : undefined}
    >
      {label && <ArkTreeView.Label data-slot="tree-view-label" className={r.label()}>{label}</ArkTreeView.Label>}
      <ArkTreeView.Tree ref={tree} data-slot="tree-view-tree" className={r.tree()}>
        <div ref={layer} data-slot="tree-view-highlight" className={r.highlight()} aria-hidden />
        {collection.rootNode.children?.map((node, i) => <TreeNode key={node.value} node={node} indexPath={[i]} />)}
      </ArkTreeView.Tree>
    </ArkTreeView.Root>
  );
}
