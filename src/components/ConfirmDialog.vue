<template>
  <Dialog :open="visible" @update:open="onDialogOpenChange">
    <DialogContent :show-close-button="false" class="max-w-[300px]">
      <DialogHeader>
        <DialogTitle class="text-center">{{ title }}</DialogTitle>
        <DialogDescription v-if="message" class="text-center">{{ message }}</DialogDescription>
      </DialogHeader>
      <DialogFooter class="flex-row justify-center gap-2 sm:justify-center">
        <Button variant="outline" @click="cancel">{{ cancelText }}</Button>
        <Button variant="destructive" @click="confirm">{{ confirmText }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

const visible = ref(false)
const title = ref('')
const message = ref('')
const confirmText = ref('Confirm')
const cancelText = ref('Cancel')

type ResolveFn = (value: boolean) => void
let resolver: ResolveFn | null = null

function show(opts: { title?: string; message: string; confirmText?: string; cancelText?: string }): Promise<boolean> {
  title.value = opts.title ?? 'Confirm'
  message.value = opts.message
  confirmText.value = opts.confirmText ?? 'Confirm'
  cancelText.value = opts.cancelText ?? 'Cancel'
  visible.value = true
  return new Promise((resolve) => { resolver = resolve })
}

function onDialogOpenChange(open: boolean): void {
  if (!open) { resolver?.(false); resolver = null }
}

function confirm(): void { visible.value = false; resolver?.(true); resolver = null }
function cancel(): void { visible.value = false; resolver?.(false); resolver = null }

defineExpose({ show })
</script>
