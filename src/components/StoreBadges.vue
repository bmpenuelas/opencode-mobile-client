<script setup lang="ts">
import { useI18n } from '@/i18n'

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-wrap gap-3 justify-center items-center">
    <a
      href="https://play.google.com/store/apps/details?id=com.logicedge.opencodemobile"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('store.googlePlay')"
    >
      <img
        src="/img/install_google_play_color_light.png"
        :alt="t('store.googlePlay')"
        class="h-11 w-auto"
        loading="lazy"
      />
    </a>
    <a
      href="https://apps.apple.com/app/id6787161501"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('store.appStore')"
    >
      <img
        src="/img/install_app_store_color_light.png"
        :alt="t('store.appStore')"
        class="h-11 w-auto"
        loading="lazy"
      />
    </a>
    <a
      href="https://marketplace.visualstudio.com/items?itemName=bmpenuelas.opencode-web-sidebar"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="t('store.vscode')"
    >
      <img
        src="/img/install_vscode_color_light.png"
        :alt="t('store.vscode')"
        class="h-11 w-auto"
        loading="lazy"
      />
    </a>
  </div>
</template>
