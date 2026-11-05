<template>
  <div class="min-h-dvh flex flex-col">
    <header class="flex items-center gap-3 px-4 pt-4">
      <Button variant="ghost" size="icon" @click="goBack" :aria-label="t('common.back')">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h1 class="text-lg font-semibold">{{ isEdit ? t('form.editTitle') : t('form.addTitle') }}</h1>
    </header>

    <form novalidate class="flex-1 p-4 flex flex-col overflow-y-auto pb-6" @submit.prevent="handleSubmit">
      <div class="flex-1 flex flex-col justify-center gap-4">
      <SetupTip v-if="showSetupTip" :title="t('tips.onComputer')" :steps="setupSteps">
        <Badge variant="outline" class="h-auto whitespace-normal"><Wifi />{{ t('tips.chipNetwork') }}</Badge>
        <Badge v-if="usesPairing" variant="outline" class="h-auto whitespace-normal"><Clock />{{ t('tips.chipLink') }}</Badge>
        <Badge v-else-if="!form.legacyV1" variant="outline" class="h-auto whitespace-normal"><User />{{ t('tips.chipUsername') }}</Badge>
      </SetupTip>
      <p v-if="isEdit && form.legacyV1" class="flex gap-1.5 text-xs leading-relaxed text-muted-foreground">
        <Info class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>{{ t('tips.v1Upgrade') }}</span>
      </p>
      <Card>
        <CardContent class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <Label for="name" class="text-center justify-center">{{ t('form.name') }}</Label>
            <Input id="name" v-model="form.name" :placeholder="t('form.namePlaceholder')" required />
          </div>
          <div v-if="usesPairing" class="flex flex-col gap-1.5">
            <Label for="pairingLink" class="text-center justify-center">{{ t('form.pairingLink') }}</Label>
            <Input id="pairingLink" v-model="form.pairingLink" placeholder="http://192.168.1.100:49374/auth/connect/…" inputmode="url" autocapitalize="off" autocomplete="off" spellcheck="false" />
            <p v-if="linkFeedback" class="flex gap-1.5 text-xs leading-relaxed" :class="linkFeedback.ok ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'" role="status">
              <component :is="linkFeedback.ok ? CircleCheck : TriangleAlert" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span class="min-w-0 break-words">{{ linkFeedback.text }}</span>
            </p>
            <Button v-if="canScan" type="button" variant="outline" :disabled="scanning" @click="scanPairingCode">
              <QrCode class="h-4 w-4" />
              {{ t('form.scanQr') }}
            </Button>
            <p v-if="showDarkTerminalTip" class="text-xs text-muted-foreground">{{ t('tips.scanDark') }}</p>
            <p v-if="editedProfile?.paired" class="text-xs text-muted-foreground">{{ t('form.pairingKeep', { url: sanitizeUrlForDisplay(editedProfile.baseUrl) }) }}</p>
          </div>
          <div v-else class="flex flex-col gap-1.5">
            <Label for="baseUrl" class="text-center justify-center">{{ t('form.url') }}</Label>
            <Input id="baseUrl" v-model="form.baseUrl" type="url" placeholder="http://192.168.1.100:4096" inputmode="url" required />
            <p v-if="urlWarning" class="text-xs text-muted-foreground">{{ urlWarning }}</p>
            <p v-if="urlError" class="text-xs text-destructive">{{ urlError }}</p>
          </div>
          <Button v-if="!form.legacyV1" type="button" variant="link" size="xs" class="self-center" @click="form.manual = !form.manual">
            {{ form.manual ? t('form.usePairing') : t('form.useManual') }}
          </Button>
        </CardContent>
        <CardFooter class="flex-col items-stretch gap-4">
          <div v-if="!usesPairing" class="flex items-center gap-2">
            <Switch id="auth" v-model="form.authEnabled" />
            <Label for="auth">{{ t('form.authentication') }}</Label>
          </div>
          <template v-if="!usesPairing && form.authEnabled">
            <div class="flex flex-col gap-1.5">
              <Input id="username" v-model="form.username" placeholder="username" />
            </div>
            <div class="flex flex-col gap-1.5">
              <div class="flex gap-1 items-center">
                <Input id="password" :type="showPassword ? 'text' : 'password'" v-model="form.password" placeholder="password" class="flex-1" />
                <Button v-if="form.password" type="button" variant="ghost" size="icon" @click="form.password = ''">&times;</Button>
                <Button type="button" variant="outline" size="xs" @click="showPassword = !showPassword">{{ showPassword ? t('form.hide') : t('form.show') }}</Button>
              </div>
            </div>
          </template>
          <div class="flex items-center gap-2">
            <Switch id="legacyV1" v-model="form.legacyV1" />
            <Label for="legacyV1">{{ t('form.v1Server') }}</Label>
          </div>
          <div class="flex items-center gap-2">
            <Switch id="isDefault" v-model="form.isDefault" />
            <Label for="isDefault">{{ t('form.default') }}</Label>
          </div>
        </CardFooter>
      </Card>

      <Alert v-if="formError" variant="destructive">
        <AlertDescription>{{ formError }}</AlertDescription>
      </Alert>
      </div>

      <Button type="submit" class="w-full" size="lg" :disabled="saving">
        {{ saving ? t('form.saving') : (isEdit ? t('form.saveChanges') : t('form.addTitle')) }}
      </Button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { ArrowLeft, CircleCheck, Clock, Info, QrCode, TriangleAlert, User, Wifi } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useServerStore } from '@/stores/serverStore'
import { normalizeUrl, sanitizeUrlForDisplay, validateUrl } from '@/services/opencode/url'
import { isLoopbackLink, parsePairingLink, redeemPairingLink, V2_USERNAME } from '@/services/opencode/pairing'
import { isDemoModeCredentials } from '@/services/opencode/demoMode'
import { canScanQrCode, scanQrCode } from '@/services/platform/qrScanner'
import type { ServerProfile } from '@/types'
import { useI18n } from '@/i18n'
import SetupTip from './SetupTip.vue'

const router = useRouter()
const route = useRoute()
const serverStore = useServerStore()
const { t } = useI18n()

const isEdit = computed(() => route.path.includes('/edit'))
const profileId = computed(() => route.params.id as string)
const editedProfile = computed(() => isEdit.value ? serverStore.profiles.find((p: ServerProfile) => p.id === profileId.value) : undefined)

const form = ref({
  name: serverStore.profiles.length === 0 ? `Server#1` : '',
  baseUrl: 'http://192.168.1.xxx:4096',
  authEnabled: false,
  username: 'opencode',
  password: '',
  isDefault: serverStore.profiles.length === 0,
  allowInsecureHttp: true,
  legacyV1: false,
  manual: false,
  pairingLink: '',
})

const canScan = canScanQrCode()
const usesPairing = computed(() => !form.value.legacyV1 && !form.value.manual)
// Android's scanner can't read the light-on-dark code a light terminal theme produces.
const showDarkTerminalTip = canScan && Capacitor.getPlatform() === 'android'

// Editing a working server needs no setup steps, unless it is moving to pairing.
const showSetupTip = computed(() => !isEdit.value || (usesPairing.value && !editedProfile.value?.paired))

const setupSteps = computed(() => {
  if (form.value.legacyV1) {
    return [
      { text: t('tips.v1Start'), command: 'opencode web --hostname 0.0.0.0 --port 4096' },
      { text: t('tips.v1Password') },
    ]
  }
  if (form.value.manual) {
    return [
      { text: t('tips.manualStart'), command: 'opencode serve --hostname 0.0.0.0 --port 4096' },
      { text: t('tips.manualEnter') },
    ]
  }
  return [
    { text: t('tips.pair1'), command: 'opencode service set hostname 0.0.0.0' },
    { text: t('tips.pair2'), command: 'opencode pair' },
    { text: t(canScan ? 'tips.pair3Scan' : 'tips.pair3') },
  ]
})

// Catches a link that can't work before it spends the single-use code.
const linkFeedback = computed(() => {
  const value = form.value.pairingLink.trim()
  if (!value) return null
  const link = parsePairingLink(value)
  if (!link) return { ok: false, text: t('tips.linkInvalid') }
  if (isLoopbackLink(link)) return { ok: false, text: t('form.pairingLoopback') }
  return { ok: true, text: t('tips.linkOk', { host: new URL(link.urls[0]).host }) }
})

const showPassword = ref(false)
const saving = ref(false)
const scanning = ref(false)
const formError = ref('')
const urlError = ref('')
const urlWarning = ref('')

function isDemoCredentialsInForm(): boolean {
  return form.value.authEnabled && isDemoModeCredentials({
    username: form.value.username,
    password: form.value.password,
  })
}

watch(() => form.value.baseUrl, () => {
  urlError.value = ''; urlWarning.value = ''
  if (isDemoCredentialsInForm()) return
  const result = validateUrl(form.value.baseUrl)
  if (!result.valid) urlError.value = result.error ?? t('form.invalidUrl')
  else if (result.error) urlWarning.value = result.error
})

watch(() => [form.value.authEnabled, form.value.username, form.value.password], () => {
  urlError.value = ''; urlWarning.value = ''
  if (isDemoCredentialsInForm()) return
  const result = validateUrl(form.value.baseUrl)
  if (!result.valid) urlError.value = result.error ?? t('form.invalidUrl')
  else if (result.error) urlWarning.value = result.error
})

onMounted(async () => {
  await serverStore.load()

  if (isEdit.value) {
    const profile = serverStore.profiles.find((p: ServerProfile) => p.id === profileId.value)
    if (profile) {
      form.value.name = profile.name; form.value.baseUrl = profile.baseUrl
      form.value.authEnabled = profile.authEnabled; form.value.username = profile.username
      form.value.isDefault = profile.isDefault
      form.value.allowInsecureHttp = profile.allowInsecureHttp
      form.value.legacyV1 = profile.serverVersion === 'v1'
      form.value.manual = !profile.paired
      if (profile.authEnabled && !profile.paired) {
        const pw = await serverStore.getPassword(profile.id)
        if (pw) form.value.password = pw
      }
    } else { goBack() }
  } else if (serverStore.profiles.length > 0) {
    form.value.name = `Server#${serverStore.profiles.length + 1}`
    form.value.isDefault = false
  }
})

async function scanPairingCode(): Promise<void> {
  formError.value = ''
  scanning.value = true
  try {
    const result = await scanQrCode(t('form.scanInstructions'))
    if (result.type === 'denied') formError.value = t('form.scanDenied')
    else if (result.type === 'failed') formError.value = t('form.scanFailed')
    else if (result.type === 'scanned') {
      if (parsePairingLink(result.text)) form.value.pairingLink = result.text
      else formError.value = t('form.scanInvalid')
    }
  } finally { scanning.value = false }
}

type Connection = Pick<ServerProfile, 'baseUrl' | 'authEnabled' | 'username' | 'paired'>

// Resolves what the pairing link gives this server. An error is shown instead when the
// link can't be used, and a saved pairing is kept when editing with no new link.
async function resolvePairing(): Promise<{ connection: Connection; token: string | null } | null> {
  const existing = editedProfile.value
  const value = form.value.pairingLink.trim()

  if (!value) {
    if (existing?.paired) return { connection: { ...existing, paired: true }, token: null }
    formError.value = t('form.pairingRequired')
    return null
  }

  const link = parsePairingLink(value)
  if (!link) { formError.value = t('form.pairingInvalid'); return null }

  const result = await redeemPairingLink(link)
  if (result.type === 'paired') {
    return {
      connection: { baseUrl: result.baseUrl, authEnabled: true, username: V2_USERNAME, paired: true },
      token: result.token,
    }
  }
  if (result.type === 'expired') formError.value = t('form.pairingExpired')
  else formError.value = t(isLoopbackLink(link) ? 'form.pairingLoopback' : 'form.pairingUnreachable')
  return null
}

function manualConnection(demoCredentials: boolean): Connection {
  return {
    baseUrl: demoCredentials ? form.value.baseUrl.trim() : normalizeUrl(form.value.baseUrl),
    authEnabled: form.value.authEnabled,
    username: form.value.authEnabled ? form.value.username || 'opencode' : 'opencode',
    paired: false,
  }
}

async function saveSecret(id: string, token: string | null, wasPaired: boolean): Promise<void> {
  if (token) { await serverStore.setPassword(id, token); return }
  if (usesPairing.value) return
  if (form.value.authEnabled && form.value.password) { await serverStore.setPassword(id, form.value.password); return }
  // A session token left behind would otherwise be sent as if it were the typed password.
  if (isEdit.value && (!form.value.authEnabled || wasPaired)) await serverStore.deletePassword(id)
}

async function handleSubmit(): Promise<void> {
  formError.value = ''
  if (!form.value.name.trim()) { formError.value = t('form.nameRequired'); return }
  const demoCredentials = !usesPairing.value && isDemoCredentialsInForm()
  if (!usesPairing.value && !demoCredentials) {
    const urlResult = validateUrl(form.value.baseUrl)
    if (!urlResult.valid) { formError.value = urlResult.error ?? t('form.invalidUrl'); return }
  }

  saving.value = true
  try {
    const wasPaired = editedProfile.value?.paired ?? false
    const pairing = usesPairing.value ? await resolvePairing() : null
    if (usesPairing.value && !pairing) return
    const { baseUrl, authEnabled, username, paired } = pairing?.connection ?? manualConnection(demoCredentials)

    const data = {
      name: form.value.name.trim(),
      baseUrl, authEnabled, username, paired,
      serverVersion: form.value.legacyV1 ? 'v1' as const : 'v2' as const,
      isDefault: form.value.isDefault,
      allowInsecureHttp: form.value.allowInsecureHttp || true,
      lastStatus: 'unknown' as const, lastConnectedAt: null,
    }
    if (isEdit.value) {
      await serverStore.update(profileId.value, data)
      await saveSecret(profileId.value, pairing?.token ?? null, wasPaired)
    } else {
      const profile = await serverStore.add(data)
      await saveSecret(profile.id, pairing?.token ?? null, wasPaired)
    }
    goBack()
  } catch (err: any) { formError.value = err?.message ?? t('form.saveFailed') }
  finally { saving.value = false }
}

function goBack(): void { router.push('/servers') }
</script>
