<template>
  <Sheet :open="visible" @update:open="onSheetOpenChange">
    <SheetContent side="top" :show-close-button="false" class="max-h-[70vh] overflow-y-auto pt-[env(safe-area-inset-top)]" @interact-outside="close" @escape-key-down="close">
      <SheetHeader>
        <div class="flex items-center gap-2 mb-1">
          <StatusDot :status="connectionStore.state" />
          <SheetTitle class="text-base">{{ activeProfile?.name ?? 'Unknown' }}</SheetTitle>
        </div>
        <SheetDescription class="text-xs break-all">{{ sanitizedUrl }}</SheetDescription>
        <div class="text-xs text-muted-foreground mt-1">{{ statusText }}</div>
      </SheetHeader>

      <div class="flex flex-col gap-0.5 mt-4">
        <Button v-if="connectionStore.state !== 'connected'" variant="ghost" class="justify-start" @click="reconnect">&#x21bb; Reconnect</Button>
        <Button v-if="connectionStore.isReconnecting" variant="ghost" class="justify-start" @click="cancelReconnect">&#x2715; Cancel Reconnect</Button>
        <Button variant="ghost" class="justify-start" @click="refreshIframe">&#x21bb; Refresh</Button>
        <Button variant="ghost" class="justify-start" @click="switchServer">&#x21c4; Switch Server</Button>
        <Button variant="ghost" class="justify-start" @click="editServer">&#x270e; Edit Current Server</Button>
        <Button variant="ghost" class="justify-start" @click="manageServers">&#x2630; Manage Servers</Button>

        <Separator class="my-1" />

        <Button variant="ghost" class="justify-start text-destructive hover:text-destructive" @click="disconnect">&#x25c0; Disconnect</Button>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useConnectionStore } from '@/stores/connectionStore'
import { sanitizeUrlForDisplay } from '@/services/opencode/url'
import type { ServerProfile } from '@/types'
import StatusDot from './StatusDot.vue'

const emit = defineEmits<{ refresh: []; close: [] }>()
const router = useRouter()
const connectionStore = useConnectionStore()

const visible = ref(false)

const activeProfile = computed<ServerProfile | null>(() => connectionStore.activeServer)
const sanitizedUrl = computed(() => activeProfile.value ? sanitizeUrlForDisplay(activeProfile.value.baseUrl) : '')
const statusText = computed(() => {
  const map: Record<string, string> = {
    connected: 'Connected', checking: 'Checking...', reconnecting: 'Reconnecting...',
    disconnected: 'Disconnected', unreachable: 'Unreachable', auth_required: 'Auth required',
    wrong_credentials: 'Wrong credentials', frame_blocked: 'Frame blocked', idle: 'Idle',
  }
  return map[connectionStore.state] ?? connectionStore.state
})

function onSheetOpenChange(open: boolean): void {
  if (!open) { visible.value = false; emit('close') }
}

function open(): void { visible.value = true }
function close(): void { visible.value = false; emit('close') }

function reconnect(): void { if (activeProfile.value) connectionStore.connect(activeProfile.value.id); close() }
function cancelReconnect(): void { connectionStore.cancelReconnect(); close() }
function refreshIframe(): void { emit('refresh'); close() }
function switchServer(): void { close(); connectionStore.disconnect(); router.push('/servers') }
function editServer(): void { if (activeProfile.value) { close(); router.push(`/servers/${activeProfile.value.id}/edit`) } }
function manageServers(): void { close(); connectionStore.disconnect(); router.push('/servers') }
async function disconnect(): Promise<void> { connectionStore.disconnect(); close(); router.push('/') }

defineExpose({ open, close })
</script>
