<script setup lang="ts">
/** A hierarchy of rows that open and close. Behaviour by Ark UI (Zag tree-view). */
import { TreeView as ArkTreeView, createTreeCollection } from "@ark-ui/vue/tree-view";
import { PhCaretRight } from "@phosphor-icons/vue";
import { computed, defineComponent, onBeforeUnmount, onMounted, ref, useAttrs, type Component, type PropType, type VNode } from "vue";
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
  icon?: Component;
};

/* the caller's class goes through the recipe; data-* land on the root */
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();

const props = withDefaults(
  defineProps<{
    items: ReadonlyArray<TreeViewNode>;
    /** Uncontrolled: the branches open at first (bind v-model:expandedValue to control them). */
    defaultExpandedValue?: string[];
    /** Uncontrolled: the nodes selected at first (bind v-model:selectedValue to control them). */
    defaultSelectedValue?: string[];
    /** multiple: Ctrl / Cmd + click and Shift + arrows add to the selection. */
    selectionMode?: "single" | "multiple";
    /** The tree's name, shown above it. Without one, pass aria-label. */
    label?: string;
    ariaLabel?: string;
    /** Row height on the control scale: xs 24 (dense side panes) · sm 28 · md 32 · lg 36. Dimensions only. */
    size?: "xs" | "sm" | "md" | "lg";
  }>(),
  { selectionMode: "single", size: "md" },
);
/** v-model:expandedValue — the open branches. Unbound: local state. */
const expandedValue = defineModel<string[] | undefined>("expandedValue", { default: undefined });
/** v-model:selectedValue — the selected nodes. Unbound: local state. */
const selectedValue = defineModel<string[] | undefined>("selectedValue", { default: undefined });
const emit = defineEmits<{ expandedValueChange: [value: string[]]; selectedValueChange: [value: string[]] }>();

const collection = computed(() =>
  createTreeCollection<TreeViewNode>({
    rootNode: { value: "", label: "", children: props.items as TreeViewNode[] },
    nodeToString: (n) => n.label,
  }),
);
const translations = computed(() => (props.ariaLabel ? { treeLabel: props.ariaLabel } : undefined));
const r = treeView();

/* one node, recursively: the node template is defined once in the template below (DefineNode)
 * and rendered by UseNode, which the template itself uses for a branch's children */
type NodeSlot = (props: { node: TreeViewNode; indexPath: number[] }) => VNode[];
let renderNode: NodeSlot | undefined;
const DefineNode = defineComponent({
  setup(_, { slots }) {
    return () => { renderNode = slots.default as NodeSlot | undefined; return null; };
  },
});
const UseNode = defineComponent({
  props: { node: { type: Object as PropType<TreeViewNode>, required: true }, indexPath: { type: Array as PropType<number[]>, required: true } },
  setup(p) {
    return () => renderNode?.({ node: p.node, indexPath: p.indexPath });
  },
});

function onExpanded(next: string[]) {
  expandedValue.value = next;
  emit("expandedValueChange", next);
}
function onSelected(next: string[]) {
  selectedValue.value = next;
  emit("selectedValueChange", next);
}

/* the highlight's parent is the tree element (the glide's container) */
const layer = ref<HTMLElement | null>(null);
let stopGlide: (() => void) | undefined;
onMounted(() => {
  trackModality();
  const tree = layer.value?.parentElement;
  if (tree && layer.value) stopGlide = glideTree(tree, layer.value);
});
onBeforeUnmount(() => stopGlide?.());
</script>

<template>
  <DefineNode v-slot="{ node, indexPath }">
    <ArkTreeView.NodeProvider :node="node" :index-path="indexPath">
      <ArkTreeView.Branch v-if="node.children" data-slot="tree-view-branch" :class="r.branch()">
        <ArkTreeView.BranchControl data-slot="tree-view-branch-control" :class="r.branchControl()">
          <ArkTreeView.BranchIndicator data-slot="tree-view-caret" :class="r.caret()"><PhCaretRight data-slot="icon" weight="bold" /></ArkTreeView.BranchIndicator>
          <span v-if="node.icon" data-slot="tree-view-icon" :class="r.icon()" aria-hidden="true"><component :is="node.icon" /></span>
          <ArkTreeView.BranchText data-slot="tree-view-text" :class="r.text()">{{ node.label }}</ArkTreeView.BranchText>
        </ArkTreeView.BranchControl>
        <ArkTreeView.BranchContent data-slot="tree-view-content" :class="r.content()">
          <div data-slot="tree-view-body" :class="r.body()">
            <ArkTreeView.BranchIndentGuide data-slot="tree-view-guide" :class="r.guide()" />
            <UseNode v-for="(child, i) in node.children" :key="child.value" :node="child" :index-path="[...indexPath, i]" />
          </div>
        </ArkTreeView.BranchContent>
      </ArkTreeView.Branch>
      <ArkTreeView.Item v-else data-slot="tree-view-item" :class="r.item()">
        <span v-if="node.icon" data-slot="tree-view-icon" :class="r.icon()" aria-hidden="true"><component :is="node.icon" /></span>
        <ArkTreeView.ItemText data-slot="tree-view-text" :class="r.text()">{{ node.label }}</ArkTreeView.ItemText>
      </ArkTreeView.Item>
    </ArkTreeView.NodeProvider>
  </DefineNode>
  <ArkTreeView.Root
    v-bind="attrs"
    data-slot="tree-view"
    :class="r.base({ size, class: attrs.class as string | undefined })"
    :collection="collection"
    :expanded-value="expandedValue"
    :default-expanded-value="defaultExpandedValue"
    :selected-value="selectedValue"
    :default-selected-value="defaultSelectedValue"
    :selection-mode="selectionMode"
    :translations="translations"
    @expanded-change="(d) => onExpanded(d.expandedValue)"
    @selection-change="(d) => onSelected(d.selectedValue)"
  >
    <ArkTreeView.Label v-if="label" data-slot="tree-view-label" :class="r.label()">{{ label }}</ArkTreeView.Label>
    <ArkTreeView.Tree data-slot="tree-view-tree" :class="r.tree()">
      <div ref="layer" data-slot="tree-view-highlight" :class="r.highlight()" aria-hidden="true" />
      <UseNode v-for="(node, i) in collection.rootNode.children ?? []" :key="node.value" :node="node" :index-path="[i]" />
    </ArkTreeView.Tree>
  </ArkTreeView.Root>
</template>
