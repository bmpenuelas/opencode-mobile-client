<template>
  <div class="min-h-dvh flex flex-col px-6">
    <div class="flex-1 flex flex-col items-center justify-center">
      <div class="w-full max-w-sm flex flex-col items-center gap-6">
        <div class="text-center my-15 mt-33">
          <picture>
            <source srcset="/opencode-logo-dark.svg" media="(prefers-color-scheme: dark)">
            <img src="/opencode-logo-light.svg" alt="OpenCode" class="h-10 mx-auto mb-4" />
          </picture>
          <h1 class="text-2xl font-bold mb-1">OpenCode Mobile &lt;Client&gt;</h1>
          <p class="text-sm text-muted-foreground">connect to your OpenCode servers on the go</p>
        </div>

        <Card v-if="defaultProfile" class="cursor-pointer" @click="connectDefault" tabindex="0" @keydown.enter="connectDefault">
          <CardContent class="flex items-center gap-2.5">
            <StatusDot :status="statusForDot" />
            <div class="flex-1 min-w-0">
              <CardTitle class="text-sm">{{ defaultProfile.name }}</CardTitle>
              <CardDescription class="text-xs break-all">{{ sanitizeUrl(defaultProfile.baseUrl) }}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" @click.stop="connectDefault" title="Connect">&#9654;</Button>
          </CardContent>
          <CardFooter class="text-xs text-muted-foreground pt-[4.7px] pb-3">
            {{ stateLabel }}
          </CardFooter>
        </Card>

        <Card
          v-else
          class="w-full cursor-pointer"
          @click="addServer"
          tabindex="0"
          @keydown.enter="addServer"
        >
          <CardContent class=" text-center">
            <p class="text-sm text-muted-foreground">No server configured yet</p>
          </CardContent>
        </Card>

        <div class="w-full flex flex-col gap-0">
          <Button
            v-if="defaultProfile && canConnect"
            size="lg"
            class="w-full"
            @click="connectDefault"
          >
            {{ defaultProfile.authEnabled ? 'Connect & Sign In' : 'Connect' }}
          </Button>
          <Button variant="outline" @click="addServer" class="mb-8">
            {{ defaultProfile ? 'Add Another Server' : 'Add OpenCode Server' }}
          </Button>
          <Button variant="ghost" @click="manageServers">
            Manage Servers
          </Button>
          <Button variant="ghost" @click="openSettings">
            Settings
          </Button>
        </div>
      </div>
    </div>

    <div class="flex justify-center pb-6">
      <Button variant="ghost" class="text-muted-foreground" @click="openHelp">
        Help
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { useServerStore } from '@/stores/serverStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { sanitizeUrlForDisplay } from '@/services/opencode/url'
import { configureSystemBars } from '@/services/platform/systemBars'
import { useServerHealthPoll } from '@/composables/useServerHealthPoll'
import StatusDot from './StatusDot.vue'

const router = useRouter()
const serverStore = useServerStore()
const connectionStore = useConnectionStore()

const poll = useServerHealthPoll()

const defaultProfile = computed(() => serverStore.defaultProfile)

const statusForDot = computed(() => {
  if (!defaultProfile.value) return 'unknown'
  const r = serverStore.reachable[defaultProfile.value.id]
  return r === true ? 'online' : r === false ? 'offline' : 'unknown'
})

const canConnect = computed(() => !!defaultProfile.value)

const stateLabel = computed(() => {
  if (!defaultProfile.value) return ''
  const r = serverStore.reachable[defaultProfile.value.id]
  if (r === true) {
    if (defaultProfile.value.id === connectionStore.lastWebviewServerId) return 'Connected'
    return 'Ready to connect'
  }
  return r === false ? 'Offline' : 'Ready to connect'
})

function sanitizeUrl(url: string): string { return sanitizeUrlForDisplay(url) }

onMounted(async () => {
  await serverStore.load()
  poll.pollNow()
  configureSystemBars()
  if (defaultProfile.value && defaultProfile.value.autoConnect) connectionStore.connect(defaultProfile.value.id)
})

async function connectDefault(): Promise<void> { if (defaultProfile.value) router.push(`/connect/${defaultProfile.value.id}`) }
function addServer(): void { router.push('/servers/new') }
function manageServers(): void { router.push('/servers') }
function openSettings(): void { router.push('/settings') }
function openHelp(): void { router.push('/help') }
</script>
