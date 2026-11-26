<script lang="ts">
  import { EntityChip, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fndn/svelte";

  const projects = [
    { name: "web-app", owner: "Maya Chen", color: "var(--fndn-tag-orange)", deploys: "1,284" },
    { name: "billing-api", owner: "Daniel Okafor", color: "var(--fndn-tag-blue)", deploys: "214" },
    { name: "data-pipeline", owner: "Sofia Alvarez", color: "var(--fndn-tag-pink)", deploys: "57" },
  ];
</script>

<Table aria-label="Projects" class="w-[400px] max-w-full">
  <TableHeader>
    <TableRow>
      <TableHead>Project</TableHead>
      <TableHead>Owner</TableHead>
      <TableHead numeric>Deploys</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {#each projects as project (project.name)}
      <TableRow>
        <TableCell>{project.name}</TableCell>
        <TableCell><EntityChip name={project.owner} color={project.color} /></TableCell>
        <TableCell numeric>{project.deploys}</TableCell>
      </TableRow>
    {/each}
  </TableBody>
</Table>
