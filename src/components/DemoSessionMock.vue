<template>
  <div class="min-h-dvh bg-background text-foreground flex flex-col">
    <header class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 py-3">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold truncate">OpenCode Demo Session</p>
          <p class="text-xs text-muted-foreground truncate">{{ profileName }}</p>
        </div>
        <div class="flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <span class="h-2 w-2 rounded-full bg-green-500" />
          <span>Online</span>
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
            {{ message.role === 'user' ? 'You' : 'OpenCode' }}
          </div>
          <p class="whitespace-pre-wrap text-sm leading-6">{{ message.content }}</p>
        </div>
      </div>
    </main>

    <footer class="border-t bg-background px-4 py-3">
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <div class="rounded-2xl border bg-card px-4 py-3 text-sm text-muted-foreground">
          Try asking about the repo, debugging an issue, or generating a patch.
        </div>
        <div class="flex items-end gap-2">
          <textarea
            v-model="draft"
            rows="3"
            class="min-h-24 flex-1 resize-none rounded-2xl border bg-background px-4 py-3 text-sm outline-none"
            placeholder="Type a demo prompt..."
          />
          <button
            type="button"
            class="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
            :disabled="!draft.trim()"
            @click="sendDemoMessage"
          >
            Send
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface DemoMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

defineProps<{
  profileName: string
}>()

const draft = ref('Show me how this app connects to OpenCode.')
const messages = ref<DemoMessage[]>([
  {
    id: 'assistant-1',
    role: 'assistant',
    content: 'I traced the connection flow through the mobile client. The app loads the saved server profile, performs a health check, and then opens the session inside the native webview shell.',
  },
  {
    id: 'user-1',
    role: 'user',
    content: 'Can you inspect the mobile client and summarize how server connection works?',
  },
  {
    id: 'assistant-2',
    role: 'assistant',
    content: 'Sure — profiles are stored locally, connection state is managed in Pinia, and successful checks transition into the full-screen session view. There is also reconnect handling and periodic health polling once the session is up.',
  },
  {
    id: 'user-2',
    role: 'user',
    content: 'Could you add a lightweight demo mode for sales walkthroughs?',
  },
  {
    id: 'assistant-3',
    role: 'assistant',
    content: 'Yes. I would special-case a known demo profile, keep the status online, and swap the webview for a local chat mock so the experience stays smooth during a walkthrough.',
  },
])

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
  let response = 'I checked that path and the flow looks good. Next I would tighten the UX details and verify the connected state, retry behavior, and session shell interactions.'

  if (lower.includes('connect') || lower.includes('connection') || lower.includes('server')) {
    response = 'The connection path looks healthy. I would keep the preflight health check, mark the profile online, and then hand off into the session shell once authentication succeeds.'
  } else if (lower.includes('bug') || lower.includes('fix') || lower.includes('issue')) {
    response = 'I found the likely failure point. I would patch it in the store/component boundary first, then run a build and validate the behavior with a quick end-to-end check.'
  } else if (lower.includes('ui') || lower.includes('design') || lower.includes('mock')) {
    response = 'The UI direction makes sense. I would keep the layout simple, preserve the current visual language, and make the session feel consistent with the live OpenCode view.'
  } else if (lower.includes('test') || lower.includes('build') || lower.includes('verify')) {
    response = 'I would validate this with a production build plus a quick manual pass through the main connection scenarios: success, auth failure, unreachable server, and reconnect.'
  } else if (lower.includes('demo')) {
    response = 'For the demo flow, I would keep the status pinned online and preload a believable conversation so the session immediately feels active when someone taps Connect.'
  }

  messages.value.push({
    id: `assistant-${suffix}`,
    role: 'assistant',
    content: response,
  })
  draft.value = ''
}
</script>
