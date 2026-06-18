export function buildBasicAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`
  const encoded = btoa(unescape(encodeURIComponent(credentials)))
  return `Basic ${encoded}`
}

export function encodeBasicAuthCredentials(username: string, password: string): { username: string; password: string } {
  return {
    username: encodeURIComponent(username),
    password: encodeURIComponent(password),
  }
}

export function buildAuthorizationHeader(username: string, password: string): Record<string, string> {
  return {
    Authorization: buildBasicAuthHeader(username, password),
  }
}
