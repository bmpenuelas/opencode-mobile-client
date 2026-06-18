<template>
  <span class="inline-block w-2.5 h-2.5 rounded-full shrink-0" :class="dotClass" :title="statusLabel" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const statusLabel = computed(() => {
  const map: Record<string, string> = {
    online: 'Ready to connect', offline: 'Offline', connected: 'Connected',
    checking: 'Checking...', reconnecting: 'Reconnecting...',
    idle: 'Ready to connect', auth_required: 'Authentication required',
    wrong_credentials: 'Wrong credentials', unreachable: 'Unreachable',
    frame_blocked: 'Frame blocked', disconnected: 'Disconnected', unknown: 'Unknown',
  }
  return map[props.status] ?? props.status
})

const dotClass = computed(() => {
  const s = props.status
  if (s === 'connected' || s === 'online') return 'bg-green-500'
  if (s === 'checking' || s === 'reconnecting') return 'bg-muted-foreground animate-pulse'
  if (s === 'auth_required') return 'bg-muted-foreground'
  if (['offline', 'wrong_credentials', 'unreachable', 'frame_blocked', 'disconnected'].includes(s)) return 'bg-destructive'
  return 'bg-muted'
})
</script>
