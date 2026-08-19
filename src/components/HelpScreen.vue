<template>
  <div class="min-h-dvh flex flex-col">
    <header class="flex items-center gap-3 px-4 pt-4">
      <Button variant="ghost" size="icon" @click="goBack" :aria-label="t('common.back')">
        <ArrowLeft class="h-4 w-4" />
      </Button>
      <h1 class="text-lg font-semibold">{{ t('common.help') }}</h1>
    </header>

    <div class="flex-1 p-4 flex flex-col gap-6 pb-8 overflow-y-auto">
      <section>
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{{ t('help.about') }}</h2>
        <p class="text-sm leading-relaxed">{{ t('help.aboutText') }}</p>
      </section>

      <section>
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{{ t('help.requirements') }}</h2>
        <p class="text-sm leading-relaxed" v-html="t('help.requirementsText')" />
        <br />
      </section>

      <section>
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{{ t('help.startServer') }}</h2>

        <h3 class="text-sm font-semibold mb-2">{{ t('help.noAuth') }}</h3>
        <pre class="text-xs bg-muted p-3 rounded-md overflow-x-auto mb-4">opencode web --hostname 0.0.0.0 --port 4096</pre>

        <h3 class="text-sm font-semibold mb-2">{{ t('help.withAuth') }}</h3>
        <pre class="text-xs bg-muted p-3 rounded-md overflow-x-auto mb-3">export OPENCODE_SERVER_PASSWORD="your-secret-password"
opencode serve --hostname 0.0.0.0 --port 4096</pre>
        <p class="text-sm text-muted-foreground" v-html="t('help.authDefault')" />
      </section>

      <Separator />

      <section>
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{{ t('help.troubleshooting') }}</h2>

        <div class="space-y-4">
          <div>
            <h3 class="text-sm font-semibold mb-1">{{ t('help.cannotConnect') }}</h3>
            <p class="text-sm leading-relaxed" v-html="t('help.cannotConnectText')" />
          </div>

          <div>
            <h3 class="text-sm font-semibold mb-1">{{ t('help.authRequired') }}</h3>
            <p class="text-sm leading-relaxed" v-html="t('help.authRequiredText')" />
          </div>

          <div>
            <h3 class="text-sm font-semibold mb-1">{{ t('help.wrongCredentials') }}</h3>
            <p class="text-sm leading-relaxed" v-html="t('help.wrongCredentialsText')" />
          </div>

          <div>
            <h3 class="text-sm font-semibold mb-1">{{ t('help.blank') }}</h3>
            <p class="text-sm leading-relaxed" v-html="t('help.blankText')" />
          </div>

          <div>
            <h3 class="text-sm font-semibold mb-1">{{ t('help.http') }}</h3>
            <p class="text-sm leading-relaxed" v-html="t('help.httpText')" />
          </div>

          <div>
            <h3 class="text-sm font-semibold mb-1">{{ t('help.cors') }}</h3>
            <p class="text-sm leading-relaxed">{{ t('help.corsText') }}</p>
          </div>

        </div>
      </section>

      <section>
        <h2 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{{ t('help.issues') }}</h2>
        <p class="text-sm leading-relaxed" v-html="t('help.issuesText')" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useI18n } from '@/i18n'

const router = useRouter()
const { t } = useI18n()

function goBack(): void { router.push('/') }
</script>
