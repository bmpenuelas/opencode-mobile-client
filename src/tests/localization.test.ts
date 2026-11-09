import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { setLocale, t } from '@/i18n'
import StatusDot from '@/components/StatusDot.vue'
import DemoSessionMock from '@/components/DemoSessionMock.vue'

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn().mockResolvedValue({ value: '[]' }),
    set: vi.fn(),
  },
}))

vi.mock('@aparajita/capacitor-secure-storage', () => ({
  SecureStorage: {
    getString: vi.fn().mockResolvedValue({ value: null }),
    setString: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}))

const arabic = /[\u0600-\u06FF]/

beforeEach(() => {
  localStorage.clear()
  setLocale('en-US')
})

describe('StatusDot', () => {
  it('localizes status titles after a locale switch', async () => {
    const wrapper = mount(StatusDot, { props: { status: 'connected' } })
    expect(wrapper.attributes('title')).toBe('Connected')
    setLocale('ar')
    await nextTick()
    expect(wrapper.attributes('title')).toBe(t('status.connected'))
    expect(wrapper.attributes('title')).toMatch(arabic)
  })
})

describe('DemoSessionMock', () => {
  it('rebuilds demo content when the locale changes', async () => {
    const wrapper = mount(DemoSessionMock, { props: { profileName: 'Demo' } })
    expect(wrapper.text()).toContain('Profiles are stored locally')
    setLocale('ar')
    await nextTick()
    await nextTick()
    expect(wrapper.text()).toMatch(arabic)
    expect(wrapper.text()).not.toContain('Profiles are stored locally')
  })
})

describe('connection errors', () => {
  it('uses the Arabic profile-not-found message', async () => {
    vi.resetModules()
    const { setActivePinia, createPinia } = await import('pinia')
    setActivePinia(createPinia())
    const i18n = await import('@/i18n')
    i18n.setLocale('ar')
    const { useConnectionStore } = await import('@/stores/connectionStore')
    const store = useConnectionStore()
    await store.connect('missing-id')
    expect(store.lastError).toBe(i18n.t('connection.profileNotFound'))
    expect(store.lastError).toMatch(arabic)

    i18n.setLocale('en-US')
    expect(store.lastError).toBe('Server profile not found.')
  })
})
