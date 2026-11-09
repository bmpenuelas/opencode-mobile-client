import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DemoSessionMock from '@/components/DemoSessionMock.vue'
import ServerList from '@/components/ServerList.vue'
import ServerProfileForm from '@/components/ServerProfileForm.vue'
import { Switch } from '@/components/ui/switch'

const profile = {
  id: 'p1',
  name: 'Local',
  baseUrl: 'http://192.168.1.5:4096',
  authEnabled: false,
  username: 'opencode',
  isDefault: true,
  allowInsecureHttp: true,
  lastStatus: 'unknown',
  lastConnectedAt: null,
}

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ path: '/servers/new', params: {}, query: {} }),
}))

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({
      value: key === 'opencode_server_profiles' ? JSON.stringify([profile]) : null,
    })),
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

vi.mock('@/composables/useServerHealthPoll', () => ({
  useServerHealthPoll: () => ({ pollNow: vi.fn() }),
}))

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

describe('RTL shell layout', () => {
  it('uses logical spacing for the demo bubbles', () => {
    const wrapper = mount(DemoSessionMock, { props: { profileName: 'Demo' } })
    expect(wrapper.findAll('.ms-8').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.me-8').length).toBeGreaterThan(0)
    expect(wrapper.html()).not.toMatch(/[\s"]m[lr]-[0-9]/)
  })

  it('mirrors the back arrow and keeps the server URL left-to-right', async () => {
    const wrapper = mount(ServerList)
    await flushPromises()

    const backIcon = wrapper.find('header svg')
    expect(backIcon.exists()).toBe(true)
    expect(backIcon.classes()).toContain('rtl:rotate-180')

    const url = wrapper.find('[dir="ltr"]')
    expect(url.exists()).toBe(true)
    expect(url.text()).toContain('192.168.1.5')
  })

  it('keeps credential and URL inputs left-to-right', async () => {
    const wrapper = mount(ServerProfileForm)
    await nextTick()

    const urlInput = wrapper.find('#baseUrl')
    expect(urlInput.attributes('dir')).toBe('ltr')

    const form = (wrapper.vm as unknown as { form: { authEnabled: boolean } }).form
    form.authEnabled = true
    await nextTick()

    expect(wrapper.find('#username').attributes('dir')).toBe('ltr')
    expect(wrapper.find('#password').attributes('dir')).toBe('ltr')
  })

  it('provides an RTL override for the checked switch thumb', () => {
    const wrapper = mount(Switch)
    const thumb = wrapper.find('[data-slot="switch-thumb"]')
    expect(thumb.classes().some((c) => c.startsWith('rtl:') && c.includes('translate-x-[calc(-100%+2px)]'))).toBe(true)
  })
})
