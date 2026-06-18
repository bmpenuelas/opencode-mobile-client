<template>
  <div class="min-h-dvh flex flex-col">
    <header class="flex items-center gap-3 px-4 pt-4">
      <Button variant="ghost" size="icon" @click="goBack" aria-label="Go back">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h1 class="text-lg font-semibold">{{ isEdit ? 'Edit Server' : 'Add Server' }}</h1>
    </header>

    <form class="flex-1 p-4 flex flex-col overflow-y-auto pb-6" @submit.prevent="handleSubmit">
      <div class="flex-1 flex flex-col justify-center gap-4">
      <Card>
        <CardContent class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <Label for="name" class="text-center justify-center">Server Name</Label>
            <Input id="name" v-model="form.name" placeholder="My OpenCode Server" required />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="baseUrl" class="text-center justify-center">Server URL</Label>
            <Input id="baseUrl" v-model="form.baseUrl" type="url" placeholder="http://192.168.1.100:4096" inputmode="url" required />
            <p v-if="urlWarning" class="text-xs text-muted-foreground">{{ urlWarning }}</p>
            <p v-if="urlError" class="text-xs text-destructive">{{ urlError }}</p>
          </div>
        </CardContent>
        <CardFooter class="flex-col items-stretch gap-4">
          <div class="flex items-center gap-2">
            <Switch id="auth" v-model="form.authEnabled" />
            <Label for="auth">Authentication enabled</Label>
          </div>
          <template v-if="form.authEnabled">
            <div class="flex flex-col gap-1.5">
              <Input id="username" v-model="form.username" placeholder="username" />
            </div>
            <div class="flex flex-col gap-1.5">
              <div class="flex gap-1 items-center">
                <Input id="password" :type="showPassword ? 'text' : 'password'" v-model="form.password" placeholder="password" class="flex-1" />
                <Button v-if="form.password" type="button" variant="ghost" size="icon" @click="form.password = ''">&times;</Button>
                <Button type="button" variant="outline" size="xs" @click="showPassword = !showPassword">{{ showPassword ? 'hide' : 'show' }}</Button>
              </div>
            </div>
          </template>
          <div class="flex items-center gap-2">
            <Switch id="autoConnect" v-model="form.autoConnect" />
            <Label for="autoConnect">Auto-connect on app open</Label>
          </div>
          <div class="flex items-center gap-2">
            <Switch id="isDefault" v-model="form.isDefault" />
            <Label for="isDefault">Set as default server</Label>
          </div>
        </CardFooter>
      </Card>

      <Alert v-if="formError" variant="destructive">
        <AlertDescription>{{ formError }}</AlertDescription>
      </Alert>
      </div>

      <Button type="submit" class="w-full" size="lg" :disabled="saving">
        {{ saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Server') }}
      </Button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useServerStore } from '@/stores/serverStore'
import { normalizeUrl, validateUrl } from '@/services/opencode/url'
import type { ServerProfile } from '@/types'

const router = useRouter()
const route = useRoute()
const serverStore = useServerStore()

const isEdit = computed(() => route.path.includes('/edit'))
const profileId = computed(() => route.params.id as string)

const form = ref({
  name: serverStore.profiles.length === 0 ? `Server#1` : '',
  baseUrl: 'http://192.168.1.xxx:4096',
  authEnabled: false,
  username: 'opencode',
  password: '',
  isDefault: serverStore.profiles.length === 0,
  autoConnect: serverStore.profiles.length === 0,
  allowInsecureHttp: true,
})

const showPassword = ref(false)
const saving = ref(false)
const formError = ref('')
const urlError = ref('')
const urlWarning = ref('')

watch(() => form.value.baseUrl, () => {
  urlError.value = ''; urlWarning.value = ''
  const result = validateUrl(form.value.baseUrl)
  if (!result.valid) urlError.value = result.error ?? 'Invalid URL'
  else if (result.error) urlWarning.value = result.error
})

onMounted(async () => {
  await serverStore.load()

  if (isEdit.value) {
    const profile = serverStore.profiles.find((p: ServerProfile) => p.id === profileId.value)
    if (profile) {
      form.value.name = profile.name; form.value.baseUrl = profile.baseUrl
      form.value.authEnabled = profile.authEnabled; form.value.username = profile.username
      form.value.isDefault = profile.isDefault; form.value.autoConnect = profile.autoConnect
      form.value.allowInsecureHttp = profile.allowInsecureHttp
      if (profile.authEnabled) {
        const pw = await serverStore.getPassword(profile.id)
        if (pw) form.value.password = pw
      }
    } else { goBack() }
  } else if (serverStore.profiles.length > 0) {
    form.value.name = `Server#${serverStore.profiles.length + 1}`
    form.value.isDefault = false
    form.value.autoConnect = false
  }
})

async function handleSubmit(): Promise<void> {
  formError.value = ''
  if (!form.value.name.trim()) { formError.value = 'Server name is required'; return }
  const urlResult = validateUrl(form.value.baseUrl)
  if (!urlResult.valid) { formError.value = urlResult.error ?? 'Invalid URL'; return }

  saving.value = true
  try {
    const data = {
      name: form.value.name.trim(), baseUrl: normalizeUrl(form.value.baseUrl),
      authEnabled: form.value.authEnabled,
      username: form.value.authEnabled ? form.value.username || 'opencode' : 'opencode',
      isDefault: form.value.isDefault, autoConnect: form.value.autoConnect,
      allowInsecureHttp: form.value.allowInsecureHttp || true,
      lastStatus: 'unknown' as const, lastConnectedAt: null,
    }
    if (isEdit.value) {
      await serverStore.update(profileId.value, data)
      if (form.value.authEnabled && form.value.password) await serverStore.setPassword(profileId.value, form.value.password)
      else if (!form.value.authEnabled) await serverStore.deletePassword(profileId.value)
    } else {
      const profile = await serverStore.add(data)
      if (form.value.authEnabled && form.value.password) await serverStore.setPassword(profile.id, form.value.password)
    }
    goBack()
  } catch (err: any) { formError.value = err?.message ?? 'Failed to save server' }
  finally { saving.value = false }
}

function goBack(): void { router.push('/servers') }
</script>
