import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useServerStore } from '@/stores/serverStore'

const POLL_INTERVAL = 5000

export function useServerHealthPoll() {
  const serverStore = useServerStore()
  const route = useRoute()

  let timer: ReturnType<typeof setInterval> | null = null

  function goOffline() {
    serverStore.profiles.forEach((p) => {
      serverStore.reachable[p.id] = false
    })
  }

  function goOnline() {
    serverStore.checkAllServers()
  }

  function isWebviewPage(): boolean {
    return route.path.startsWith('/connect/')
  }

  function start() {
    stop()
    if (isWebviewPage()) return

    timer = setInterval(() => {
      if (isWebviewPage()) {
        stop()
        return
      }
      serverStore.checkAllServers()
    }, POLL_INTERVAL)
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function pollNow() {
    if (!isWebviewPage()) {
      serverStore.checkAllServers()
    }
  }

  onMounted(() => start())
  onUnmounted(() => stop())

  window.addEventListener('offline', goOffline)
  window.addEventListener('online', goOnline)

  return { start, stop, pollNow }
}
