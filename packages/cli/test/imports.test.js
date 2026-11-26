// The names an adapter file exports, which the indexes and the import rewriting are built from.
import test from "node:test";
import assert from "node:assert/strict";
import { exportedNames } from "../src/imports.js";

test("a Vue or Svelte adapter exports its component, its values and its types, declared or passed on", () => {
  const vue = `<script lang="ts">
import type { Row } from "./table.logic";
export type TableColumn = { id: string };
export interface TableSort { id: string }
export type { Row, Row as TableRow };
export type { Labels as TableLabels } from "./table.logic";
export const tableDefaults = {};
</script>
<script setup lang="ts">
const hidden = 1;
</script>`;
  assert.deepEqual(exportedNames("vue", "Table.vue", vue), ["Table", "tableDefaults", "TableColumn", "TableSort", "Row", "TableRow", "TableLabels"]);
  const svelte = `<script lang="ts" module>
export type { Action as SelectionAction } from "./selection-actions.logic";
export function helper() {}
</script>
<script lang="ts">
let { actions } = $props();
</script>`;
  assert.deepEqual(exportedNames("svelte", "SelectionActions.svelte", svelte), ["SelectionActions", "helper", "SelectionAction"]);
});

test("a React adapter exports what it names, in a declaration or a list", () => {
  const tsx = `export type ButtonProps = {};
export const Button = () => null;
export { Spinner, type SpinnerProps as Busy };
export type { Size } from "./button.logic";`;
  assert.deepEqual(exportedNames("react", "button.tsx", tsx), ["ButtonProps", "Button", "Spinner", "Busy", "Size"]);
});
