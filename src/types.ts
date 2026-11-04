export interface ServerProfile {
  id: string
  name: string
  baseUrl: string
  authEnabled: boolean
  username: string
  isDefault: boolean
  allowInsecureHttp: boolean
  lastStatus: ServerStatus
  lastConnectedAt: string | null
  serverVersion: ServerVersion
  /** The stored secret is a session token from a pairing link, not a password the user typed. */
  paired: boolean
}

export type ServerVersion = 'v1' | 'v2'

export type ServerStatus =
  | 'unknown'
  | 'checking'
  | 'connected'
  | 'auth_required'
  | 'wrong_credentials'
  | 'unreachable'
  | 'frame_blocked'
  | 'incompatible'

export type ConnectionState = ServerStatus | 'idle' | 'reconnecting' | 'disconnected'

export interface HealthCheckResult {
  reachable: boolean
  status: ServerStatus
  statusCode?: number
}

export interface ConnectionConfig {
  healthCheckTimeoutMs: number
  healthPollIntervalMs: number
  exponentialReconnect: boolean
}
