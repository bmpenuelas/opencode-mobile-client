<template>
  <div class="min-h-dvh flex flex-col">
    <header class="flex items-center gap-3 px-4 pt-4">
      <Button variant="ghost" size="icon" @click="goBack" aria-label="Go back">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h1 class="text-lg font-semibold">Settings</h1>
    </header>

    <div class="flex-1 p-4 flex flex-col gap-6 pb-6">
      <section>
        <h2 class="mt-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">Connection</h2>

        <div class="flex flex-col gap-1.5 mb-3 mx-auto w-full max-w-sm">
          <Label class="text-center justify-center">Health check timeout (ms)</Label>
          <Input v-model.number="timeoutMs" type="number" min="1000" max="30000" step="100" class="w-full text-muted-foreground" />
        </div>

        <div class="flex flex-col gap-1.5 mb-6 mx-auto w-full max-w-sm">
          <Label class="text-center justify-center">Health poll interval (ms)</Label>
          <Input v-model.number="pollMs" type="number" min="2000" max="60000" step="1000" class="w-full text-muted-foreground" />
        </div>

        <div class="flex items-center gap-2">
          <Switch id="expReconnect" v-model="exponentialReconnect" />
          <Label for="expReconnect">Exponential reconnect</Label>
        </div>
      </section>

      <section class="mt-auto">
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">About</h2>
        <p class="text-sm mb-2">OpenCode Mobile Client</p>
        <p class="text-xs text-muted-foreground leading-relaxed"><strong>A mobile client for OpenCode servers.</strong> Connect to your self-hosted OpenCode instance over LAN or VPN / Tailscale. This is a fully open-source community project <strong>(not official)</strong>. You can find the code on <a href="https://github.com/bmpenuelas/opencode-mobile-client" target="_blank" rel="noopener noreferrer" class="text-blue-700 dark:text-blue-400 no-underline font-semibold">GitHub</a>, and submit issues and requests there. PRs are welcome! <span class="text-red-500">&#x2764;</span></p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useConnectionStore } from '@/stores/connectionStore'

const router = useRouter()
const connectionStore = useConnectionStore()

const timeoutMs = ref(connectionStore.healthCheckTimeout)
const pollMs = ref(connectionStore.healthPollInterval)
const exponentialReconnect = ref(connectionStore.exponentialReconnectEnabled)

watch(timeoutMs, (val) => { if (val >= 1000 && val <= 30000) connectionStore.setHealthCheckTimeout(val) })
watch(pollMs, (val) => { if (val >= 2000 && val <= 60000) connectionStore.setHealthPollInterval(val) })
watch(exponentialReconnect, (val) => { connectionStore.setExponentialReconnect(val) })

function goBack(): void { router.push('/') }
</script>
