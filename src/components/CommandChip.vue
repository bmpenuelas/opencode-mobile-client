<template>
  <code class="block rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground break-words select-all">{{ command }}</code>
</template>

<script setup lang="ts">
defineProps<{ command: string }>()
</script>
