<template>
  <div class="min-h-dvh bg-background text-foreground flex flex-col">
    <header class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 py-3">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold truncate">{{ t('demo.title') }}</p>
          <p class="text-xs text-muted-foreground truncate">{{ profileName }}</p>
        </div>
        <div class="flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <span class="h-2 w-2 rounded-full bg-green-500" />
          <span>{{ t('demo.online') }}</span>
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto px-4 py-4">
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div
          v-for="message in messages"
          :key="message.id"
          class="rounded-2xl border px-4 py-3 shadow-sm"
          :class="message.role === 'user' ? 'ml-8 bg-muted/50' : 'mr-8 bg-card'"
        >
          <div class="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {{ message.role === 'user' ? t('demo.you') : 'OpenCode' }}
          </div>
          <p class="whitespace-pre-wrap text-sm leading-6">{{ message.content }}</p>
        </div>
      </div>
    </main>

    <footer class="border-t bg-background px-4 py-3">
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <div class="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
          {{ t('demo.hint') }}
        </div>
        <div class="flex items-end gap-2">
          <textarea
            v-model="draft"
            rows="3"
            class="min-h-24 flex-1 resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
            :placeholder="t('demo.placeholder')"
          />
          <button
            type="button"
            class="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            :disabled="!draft.trim()"
            @click="sendDemoMessage"
          >
            {{ t('demo.send') }}
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from '@/i18n'

interface DemoMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

defineProps<{
  profileName: string
}>()
const { t, locale } = useI18n()

const draft = ref(t('demo.draft'))
let defaultDraft = t('demo.draft')
const messages = ref<DemoMessage[]>([])

function buildMessages(): void {
  messages.value = [
    {
      id: 'assistant-1',
      role: 'assistant',
      content: t('demo.welcome'),
    },
    {
      id: 'user-1',
      role: 'user',
      content: t('demo.question'),
    },
    {
      id: 'assistant-2',
      role: 'assistant',
      content: t('demo.response'),
    },
    {
      id: 'user-2',
      role: 'user',
      content: t('demo.followupUser'),
    },
    {
      id: 'assistant-3',
      role: 'assistant',
      content: t('demo.demoAnswer'),
    },
  ]
}

buildMessages()

watch(locale, () => {
  buildMessages()
  // Keep a prompt the user typed, but refresh the untouched default prompt.
  if (!draft.value.trim() || draft.value === defaultDraft) draft.value = t('demo.draft')
  defaultDraft = t('demo.draft')
})

function sendDemoMessage(): void {
  const content = draft.value.trim()
  if (!content) return

  const suffix = Date.now().toString()
  messages.value.push({
    id: `user-${suffix}`,
    role: 'user',
    content,
  })

  const lower = content.toLowerCase()
  let response = t('demo.fallback')

  if (lower.includes('connect') || lower.includes('connection') || lower.includes('server')) {
    response = t('demo.replyConnect')
  } else if (lower.includes('bug') || lower.includes('fix') || lower.includes('issue')) {
    response = t('demo.replyFix')
  } else if (lower.includes('ui') || lower.includes('design') || lower.includes('mock')) {
    response = t('demo.replyUi')
  } else if (lower.includes('test') || lower.includes('build') || lower.includes('verify')) {
    response = t('demo.replyVerify')
  } else if (lower.includes('demo')) {
    response = t('demo.replyDemo')
  }

  messages.value.push({
    id: `assistant-${suffix}`,
    role: 'assistant',
    content: response,
  })
  draft.value = ''
}
</script>
