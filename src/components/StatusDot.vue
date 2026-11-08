<template>
  <span class="inline-block w-2.5 h-2.5 rounded-full shrink-0" :class="dotClass" :title="statusLabel" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/i18n'

const props = defineProps<{ status: string }>()

const { t } = useI18n()

const statusKeyMap: Record<string, string> = {
  online: 'status.ready',
  offline: 'status.offline',
  connected: 'status.connected',
  checking: 'status.checking',
  reconnecting: 'status.reconnecting',
  idle: 'status.ready',
  auth_required: 'status.authRequired',
  wrong_credentials: 'status.wrongCredentials',
  unreachable: 'status.unreachable',
  frame_blocked: 'status.blocked',
  disconnected: 'status.disconnected',
  unknown: 'status.unknown',
}

const statusLabel = computed(() => {
  const key = statusKeyMap[props.status]
  return key ? t(key) : props.status
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
