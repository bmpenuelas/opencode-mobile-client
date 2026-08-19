<template>
  <div class="min-h-dvh flex flex-col">
    <header class="flex items-center gap-3 px-4 pt-4 mb-5">
      <Button variant="ghost" size="icon" @click="goBack" :aria-label="t('common.back')">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h1 class="text-lg font-semibold flex-1">{{ t('servers.title') }}</h1>
      <Button size="sm" @click="addServer">+ {{ t('common.add') }}</Button>
    </header>

    <div v-if="serverStore.loading" class="flex-1 p-3 flex flex-col gap-2">
      <Card v-for="n in 3" :key="n">
        <CardHeader>
          <Skeleton class="h-4 w-1/2 mb-2" />
          <Skeleton class="h-3 w-3/4" />
        </CardHeader>
        <CardContent>
          <div class="flex gap-2">
            <Skeleton class="h-5 w-14 rounded-full" />
            <Skeleton class="h-5 w-20 rounded-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton class="h-8 w-12" />
          <Skeleton class="h-8 w-16 ml-1" />
        </CardFooter>
      </Card>
    </div>

    <div v-else-if="serverStore.profiles.length === 0" class="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground text-sm">
      <p>{{ t('servers.empty') }}</p>
      <Button @click="addServer">{{ t('servers.addFirst') }}</Button>
    </div>

    <div v-else class="flex-1 p-3 overflow-y-auto flex flex-col gap-2 pb-4">
      <Card v-for="profile in serverStore.sortedProfiles" :key="profile.id" :size="profile.isDefault ? 'default' : 'sm'">
        <CardHeader>
          <div class="flex items-center gap-2">
            <CardTitle class="text-sm">{{ profile.name }}</CardTitle>
            <StatusDot :status="profileStatus(profile)" />
          </div>
          <CardDescription class="text-xs break-all">{{ sanitizeUrl(profile.baseUrl) }}</CardDescription>
          <CardAction>
            <button
              type="button"
              class="relative inline-flex items-center rounded-md text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              @click="connectTo(profile.id)"
              :title="t('landing.connect')"
              :aria-label="t('servers.open')"
            >
              <span aria-hidden="true" class="absolute -inset-2" />
              <span class="text-xs">{{ t('servers.open') }}</span>
              <span class="-ml-1 inline-flex h-8 w-8 items-center justify-end"><Play class="fill-current size-3" /></span>
            </button>
          </CardAction>
        </CardHeader>
        <CardContent class="flex gap-1 flex-wrap">
          <Badge
            v-if="profile.isDefault"
            variant="outline"
            class="bg-muted/45 hover:bg-muted/45"
          >
            {{ t('servers.default') }}
          </Badge>
          <Badge v-if="profile.authEnabled" variant="outline">{{ t('form.authentication') }}</Badge>
          <span class="ml-auto text-xs text-muted-foreground self-center">{{ statusLabel(profileStatus(profile)) }}</span>
        </CardContent>
        <CardFooter class="gap-0.5">
          <Button variant="ghost" size="sm" @click.stop="editServer(profile.id)">{{ t('common.edit') }}</Button>
          <Button variant="ghost" size="sm" @click.stop="duplicateServer(profile.id)">{{ t('servers.duplicate') }}</Button>
          <Button v-if="!profile.isDefault" variant="ghost" size="sm" @click.stop="setAsDefault(profile.id)">{{ t('servers.setDefault') }}</Button>
          <Button variant="ghost" size="sm" @click.stop="confirmDelete(profile.id)">{{ t('common.delete') }}</Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Play } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useServerStore } from '@/stores/serverStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { sanitizeUrlForDisplay } from '@/services/opencode/url'
import { useServerHealthPoll } from '@/composables/useServerHealthPoll'
import type { ServerProfile } from '@/types'
import StatusDot from './StatusDot.vue'
import { useI18n } from '@/i18n'

const poll = useServerHealthPoll()

const router = useRouter()
const serverStore = useServerStore()
const connectionStore = useConnectionStore()
const { t } = useI18n()

onMounted(async () => {
  await serverStore.load()
  poll.pollNow()
})

function sanitizeUrl(url: string): string { return sanitizeUrlForDisplay(url) }

function profileStatus(profile: ServerProfile): string {
  if (profile.id === connectionStore.lastWebviewServerId) return 'connected'
  if (profile.lastStatus === 'auth_required') return 'auth_required'
  if (profile.lastStatus === 'wrong_credentials') return 'wrong_credentials'
  const r = serverStore.reachable[profile.id]
  if (r === true) return 'online'
  if (r === false) return 'offline'
  return 'unknown'
}
function statusLabel(status: string): string {
  const map: Record<string, string> = {
    online: t('status.ready'), offline: t('status.offline'), connected: t('status.connected'),
    checking: t('status.checking'), auth_required: t('status.authRequired'),
    wrong_credentials: t('status.wrongCredentials'), unreachable: t('status.unreachable'),
    frame_blocked: t('status.blocked'), unknown: t('status.unknown'),
    reconnecting: t('status.reconnecting'), disconnected: t('status.disconnected'),
  }
  return map[status] ?? status
}

function goBack(): void { router.push('/') }
function addServer(): void { router.push('/servers/new') }
function editServer(id: string): void { router.push(`/servers/${id}/edit`) }
function connectTo(id: string): void { router.push(`/connect/${id}`) }

async function duplicateServer(id: string): Promise<void> { await serverStore.duplicate(id) }
async function setAsDefault(id: string): Promise<void> { await serverStore.setDefault(id) }

async function confirmDelete(id: string): Promise<void> {
  const profile = serverStore.profiles.find((p: ServerProfile) => p.id === id)
  if (!profile) return
  const confirmed = window.confirm?.(t('servers.deleteConfirm', { name: profile.name })) ?? false
  if (confirmed) await serverStore.remove(id)
}
</script>
