import { describe, expect, it } from 'vitest'
import {
  EXTERNAL_LINK_MESSAGE_TYPE,
  parseExternalLinkUrl,
} from '@/services/platform/externalLinks'

describe('external link bridge', () => {
  it('accepts an http(s) link message', () => {
    expect(parseExternalLinkUrl({
      type: EXTERNAL_LINK_MESSAGE_TYPE,
      url: 'https://example.com/docs?page=1#intro',
    })).toBe('https://example.com/docs?page=1#intro')
  })

  it('accepts a plain http link', () => {
    expect(parseExternalLinkUrl({
      type: EXTERNAL_LINK_MESSAGE_TYPE,
      url: 'http://192.168.1.10:8080/page',
    })).toBe('http://192.168.1.10:8080/page')
  })

  it('ignores messages from the notification bridge', () => {
    expect(parseExternalLinkUrl({
      type: 'opencode:web-notification',
      title: 'Done',
    })).toBeNull()
  })

  it('rejects non-http schemes', () => {
    for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,hi', 'mailto:a@b.c']) {
      expect(parseExternalLinkUrl({ type: EXTERNAL_LINK_MESSAGE_TYPE, url })).toBeNull()
    }
  })

  it('rejects malformed payloads', () => {
    expect(parseExternalLinkUrl(undefined)).toBeNull()
    expect(parseExternalLinkUrl(null)).toBeNull()
    expect(parseExternalLinkUrl({ type: EXTERNAL_LINK_MESSAGE_TYPE })).toBeNull()
    expect(parseExternalLinkUrl({ type: EXTERNAL_LINK_MESSAGE_TYPE, url: 42 })).toBeNull()
    expect(parseExternalLinkUrl({ type: EXTERNAL_LINK_MESSAGE_TYPE, url: 'not a url' })).toBeNull()
  })
})