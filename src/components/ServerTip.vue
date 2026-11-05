<template>
  <div v-if="tip" class="flex w-full flex-col gap-1 text-left text-xs leading-relaxed text-muted-foreground">
    <p class="flex gap-1.5">
      <Info class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{{ t(tip.textKey) }}</span>
    </p>
    <CommandChip v-if="tip.command" :command="tip.command" />
    <Button v-if="tip.canEdit && editable" variant="outline" size="xs" class="self-start" @click.stop="editServer">{{ t('common.edit') }}</Button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Info } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { serverTip } from '@/services/opencode/setupTips'
import type { ServerProfile } from '@/types'
import { useI18n } from '@/i18n'
import CommandChip from './CommandChip.vue'

const props = defineProps<{
  profile: ServerProfile
  status: string
  /** Shows an Edit button for fixes made in the server's settings. */
  editable?: boolean
}>()

const router = useRouter()
const { t } = useI18n()

const tip = computed(() => serverTip(props.profile, props.status))

function editServer(): void { router.push(`/servers/${props.profile.id}/edit`) }
</script>
