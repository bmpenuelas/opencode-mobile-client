<template>
  <section class="flex flex-col gap-2.5 rounded-lg border bg-card p-3" :aria-label="title">
    <h2 class="flex items-center gap-1.5 text-sm font-medium">
      <Laptop class="size-4 text-muted-foreground" aria-hidden="true" />
      {{ title }}
    </h2>
    <ol class="flex flex-col gap-2">
      <li v-for="(step, index) in steps" :key="index" class="flex gap-2 text-xs leading-relaxed">
        <span class="flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium" aria-hidden="true">{{ index + 1 }}</span>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <span class="text-muted-foreground">{{ step.text }}</span>
          <CommandChip v-if="step.command" :command="step.command" />
        </div>
      </li>
    </ol>
    <div v-if="$slots.default" class="flex flex-wrap gap-1.5">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Laptop } from '@lucide/vue'
import CommandChip from './CommandChip.vue'

defineProps<{
  title: string
  steps: { text: string; command?: string }[]
}>()
</script>
