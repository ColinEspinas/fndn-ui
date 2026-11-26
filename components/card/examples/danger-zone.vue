<script setup lang="ts">
import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@fndn/vue";
</script>

<!-- hairline: a section among the settings of a page, no shadow -->
<template>
  <Card elevation="hairline" class="w-96 max-w-full">
    <CardHeader>
      <div>
        <CardTitle>Delete project</CardTitle>
        <CardDescription>Removes billing-api, its 214 deploys and its two domains. This cannot be undone.</CardDescription>
      </div>
    </CardHeader>
    <CardFooter>
      <Button variant="danger" size="sm">Delete billing-api</Button>
    </CardFooter>
  </Card>
</template>
