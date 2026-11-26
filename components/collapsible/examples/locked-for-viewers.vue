<script setup lang="ts">
import { Collapsible } from "@fndn/vue";
</script>

<template>
  <Collapsible
    variant="row"
    disabled
    label="Environment variables"
    meta="Admins only"
    detail="12 variables for Production, Staging and Preview."
    style="width: 320px"
  />
</template>
