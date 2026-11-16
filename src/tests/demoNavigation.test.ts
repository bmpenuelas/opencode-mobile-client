// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DemoSessionMock from '@/components/DemoSessionMock.vue'
import { t } from '@/i18n'

describe('demo navigation', () => {
  it('offers an accessible back button that requests leaving the session', async () => {
    const wrapper = mount(DemoSessionMock, { props: { profileName: 'Demo server' } })
    await wrapper.get(`button[aria-label="${t('common.back')}"]`).trigger('click')
    expect(wrapper.emitted('back')).toHaveLength(1)
    wrapper.unmount()
  })
})
