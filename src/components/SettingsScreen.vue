<template>
  <div class="min-h-dvh flex flex-col">
    <header class="flex items-center gap-3 px-4 pt-4">
      <Button variant="ghost" size="icon" @click="goBack" :aria-label="t('common.back')">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h1 class="text-lg font-semibold">{{ t('common.settings') }}</h1>
    </header>

    <div class="flex-1 p-4 flex flex-col gap-6 pb-6">
      <section>
        <h2 class="mt-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">{{ t('settings.connection') }}</h2>

        <div class="flex flex-col gap-1.5 mb-3 mx-auto w-full max-w-sm">
          <Label class="text-center justify-center">{{ t('settings.timeout') }}</Label>
          <Input v-model.number="timeoutMs" type="number" min="1000" max="30000" step="100" class="w-full text-muted-foreground" />
        </div>

        <div class="flex flex-col gap-1.5 mb-6 mx-auto w-full max-w-sm">
          <Label class="text-center justify-center">{{ t('settings.poll') }}</Label>
          <Input v-model.number="pollMs" type="number" min="2000" max="60000" step="1000" class="w-full text-muted-foreground" />
        </div>

        <div class="flex items-center gap-2">
          <Switch id="expReconnect" v-model="exponentialReconnect" />
          <Label for="expReconnect">{{ t('settings.reconnect') }}</Label>
        </div>
      </section>

      <section>
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{{ t('settings.notifications') }}</h2>
        <div class="flex items-start gap-3">
          <Switch id="nativeNotifications" v-model="notificationsEnabled" />
          <div class="flex flex-col gap-1">
            <Label for="nativeNotifications">{{ t('settings.enableNotifications') }}</Label>
            <p class="text-xs text-muted-foreground leading-relaxed">
              {{ t('settings.notificationDescription') }}
            </p>
          </div>
        </div>
      </section>

      <section class="mt-auto">
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{{ t('settings.about') }}</h2>
        <p class="text-sm mb-2">OpenCode Mobile &lt;Client&gt;</p>
        <p class="text-xs text-muted-foreground leading-relaxed" v-html="t('settings.aboutText')" />
      </section>
      <section>
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{{ t('settings.language') }}</h2>
        <select v-model="locale" class="w-full rounded-md border bg-background px-3 py-2 text-sm">
          <option v-for="option in supportedLocales" :key="option.code" :value="option.code">{{ option.label }}</option>
        </select>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useConnectionStore } from '@/stores/connectionStore'
import {
  disableNativeNotificationsFromSettings,
  enableNativeNotificationsFromSettings,
  loadNativeNotificationSettings,
} from '@/services/platform/nativeNotifications'
import { useI18n, type Locale } from '@/i18n'

const router = useRouter()
const connectionStore = useConnectionStore()
const { t, locale, setLocale, supportedLocales } = useI18n()

const timeoutMs = ref(connectionStore.healthCheckTimeout)
const pollMs = ref(connectionStore.healthPollInterval)
const exponentialReconnect = ref(connectionStore.exponentialReconnectEnabled)
const notificationsEnabled = ref(false)

let notificationsLoaded = false
let syncingNotificationsSwitch = false

watch(locale, (value) => setLocale(value as Locale))

watch(timeoutMs, (val) => { if (val >= 1000 && val <= 30000) connectionStore.setHealthCheckTimeout(val) })
watch(pollMs, (val) => { if (val >= 2000 && val <= 60000) connectionStore.setHealthPollInterval(val) })
watch(exponentialReconnect, (val) => { connectionStore.setExponentialReconnect(val) })
watch(notificationsEnabled, async (val) => {
  if (!notificationsLoaded || syncingNotificationsSwitch) return

  if (val) {
    const granted = await enableNativeNotificationsFromSettings()
    if (!granted) {
      syncingNotificationsSwitch = true
      notificationsEnabled.value = false
      syncingNotificationsSwitch = false
    }
  } else {
    await disableNativeNotificationsFromSettings()
  }
})

onMounted(async () => {
  const settings = await loadNativeNotificationSettings()
  notificationsEnabled.value = settings.enabled
  notificationsLoaded = true
})

function goBack(): void { router.push('/') }
</script>
