import { describe, it, expect } from 'vitest'
import { buildBasicAuthHeader, encodeBasicAuthCredentials, buildAuthorizationHeader } from '@/services/opencode/auth'

describe('buildBasicAuthHeader', () => {
  it('builds correct header for simple credentials', () => {
    const header = buildBasicAuthHeader('opencode', 'secret123')
    expect(header).toMatch(/^Basic /)
    const encoded = header.slice(6)
    const decoded = atob(encoded)
    expect(decoded).toBe('opencode:secret123')
  })

  it('handles special characters', () => {
    const header = buildBasicAuthHeader('user@name', 'p@ss:word!')
    const encoded = header.slice(6)
    const decoded = atob(encoded)
    expect(decoded).toBe('user@name:p@ss:word!')
  })

  it('handles empty password', () => {
    const header = buildBasicAuthHeader('opencode', '')
    const encoded = header.slice(6)
    const decoded = atob(encoded)
    expect(decoded).toBe('opencode:')
  })

  it('handles unicode characters in password', () => {
    const header = buildBasicAuthHeader('admin', 'pässwörd')
    const encoded = header.slice(6)
    const decoded = decodeURIComponent(escape(atob(encoded)))
    expect(decoded).toBe('admin:pässwörd')
  })

  it('always returns string starting with Basic', () => {
    const header = buildBasicAuthHeader('a', 'b')
    expect(typeof header).toBe('string')
    expect(header.startsWith('Basic ')).toBe(true)
  })
})

describe('encodeBasicAuthCredentials', () => {
  it('encodes simple values', () => {
    const result = encodeBasicAuthCredentials('opencode', 'secret')
    expect(result.username).toBe('opencode')
    expect(result.password).toBe('secret')
  })

  it('encodes special characters', () => {
    const result = encodeBasicAuthCredentials('user name', 'pass word')
    expect(result.username).toBe('user%20name')
    expect(result.password).toBe('pass%20word')
  })

  it('encodes symbols', () => {
    const result = encodeBasicAuthCredentials('user@host', 'p@ss')
    expect(result.password).toBe('p%40ss')
  })
})

describe('buildAuthorizationHeader', () => {
  it('returns proper header object', () => {
    const headers = buildAuthorizationHeader('opencode', 'secret')
    expect(headers.Authorization).toBeDefined()
    expect(headers.Authorization).toMatch(/^Basic /)
  })
})
