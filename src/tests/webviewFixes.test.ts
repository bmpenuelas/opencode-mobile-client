import { describe, expect, it } from 'vitest'
import {
  buildChatDragBridgeScript,
  buildDownloadBridgeScript,
  buildPreviewFixScript,
  guessDownloadMime,
  RAW_FILE_ROUTE,
} from '@/services/platform/webviewFixes'

describe('guessDownloadMime', () => {
  it('maps common text and markup extensions', () => {
    expect(guessDownloadMime('report.html')).toBe('text/html')
    expect(guessDownloadMime('README.md')).toBe('text/markdown')
    expect(guessDownloadMime('data.json')).toBe('application/json')
    expect(guessDownloadMime('notes.txt')).toBe('text/plain')
  })

  it('maps media and archive extensions', () => {
    expect(guessDownloadMime('diagram.png')).toBe('image/png')
    expect(guessDownloadMime('clip.mp4')).toBe('video/mp4')
    expect(guessDownloadMime('bundle.zip')).toBe('application/zip')
  })

  it('is case-insensitive and falls back for unknown or missing names', () => {
    expect(guessDownloadMime('SCREEN.SVG')).toBe('image/svg+xml')
    expect(guessDownloadMime('downloadfile.bin')).toBe('application/octet-stream')
    expect(guessDownloadMime('no-extension')).toBe('application/octet-stream')
    expect(guessDownloadMime(null)).toBe('application/octet-stream')
    expect(guessDownloadMime(undefined)).toBe('application/octet-stream')
  })
})

describe('download bridge script', () => {
  const script = buildDownloadBridgeScript()

  it('guards against double injection', () => {
    expect(script).toContain('__oc_downloadBridge')
  })

  it('keeps object URLs alive past the native download read', () => {
    expect(script).toContain('URL.revokeObjectURL')
    expect(script).toContain('setTimeout')
  })

  it('re-issues blob downloads from a visible, typed anchor', () => {
    expect(script).toContain('HTMLAnchorElement.prototype.click')
    expect(script).toContain('data-oc-device-download')
    expect(script).toContain('mimeFor')
  })

  it('embeds the MIME guesser source so the WebView can run it', () => {
    expect(script).toContain('function guessDownloadMime')
  })
})

describe('preview fix script', () => {
  const script = buildPreviewFixScript()

  it('guards against double injection', () => {
    expect(script).toContain('__oc_previewFix')
  })

  it('repoints sandboxed blob previews at the raw file route', () => {
    expect(script).toContain(RAW_FILE_ROUTE)
    expect(script).toContain("src.slice(0,5)!=='blob:'")
    expect(script).toContain("iframe[sandbox]")
    expect(script).toContain("data-slot=\"artifact-filename\"")
  })

  it('requires HTML content before swapping the frame', () => {
    expect(script).toContain('text/html')
    expect(script).toContain("credentials:'same-origin'")
  })
})

describe('chat drag bridge script', () => {
  const script = buildChatDragBridgeScript()

  it('guards against double injection', () => {
    expect(script).toContain('__oc_chatDrag')
  })

  it('turns a long-press on a file row into a synthetic drag', () => {
    expect(script).toContain('dataset.itemPath')
    expect(script).toContain('new DataTransfer()')
    expect(script).toContain("'dragstart'")
    expect(script).toContain("'drop'")
  })

  it('only forwards touch and pen devices', () => {
    expect(script).toContain("event.pointerType!=='touch'")
    expect(script).toContain("event.pointerType!=='pen'")
  })
})
