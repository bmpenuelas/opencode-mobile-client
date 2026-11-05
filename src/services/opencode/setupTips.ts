import type { ServerProfile } from '@/types'

export interface ServerTip {
  textKey: string
  command?: string
  /** The fix is in the server's settings, so the tip can lead to the edit screen. */
  canEdit: boolean
}

/** What to tell the user about a server in this status, or null when nothing needs fixing. */
export function serverTip(profile: Pick<ServerProfile, 'paired'>, status: string): ServerTip | null {
  switch (status) {
    case 'offline':
    case 'unreachable':
      return profile.paired
        ? { textKey: 'tips.offlinePaired', command: 'opencode service status', canEdit: false }
        : { textKey: 'tips.offline', canEdit: false }
    case 'auth_required':
      return { textKey: 'tips.authRequired', canEdit: true }
    case 'wrong_credentials':
      return profile.paired
        ? { textKey: 'tips.pairAgain', command: 'opencode pair', canEdit: true }
        : { textKey: 'tips.wrongPassword', canEdit: true }
    case 'incompatible':
      return { textKey: 'tips.incompatible', canEdit: true }
    default:
      return null
  }
}
