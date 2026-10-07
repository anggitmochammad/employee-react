const STORAGE_KEY = 'employee-management:access-token'

function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = JSON.parse(atob(normalized)) as { exp?: unknown }
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const expiry = tokenExpiry(token)
  return expiry !== null && Date.now() >= expiry
}

function readInitialToken(): string | null {
  try {
    const token = window.sessionStorage.getItem(STORAGE_KEY)
    if (token && isTokenExpired(token)) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return token
  } catch {
    return null
  }
}

let currentToken = readInitialToken()
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSessionToken(): string | null {
  return currentToken
}

export function saveSessionToken(token: string): void {
  window.sessionStorage.setItem(STORAGE_KEY, token)
  currentToken = token
  emitChange()
}

export function clearSessionToken(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // The in-memory session must still be cleared if storage is unavailable.
  }
  if (currentToken !== null) {
    currentToken = null
    emitChange()
  }
}

export function getUsableToken(): string | null {
  if (currentToken && isTokenExpired(currentToken)) {
    clearSessionToken()
  }
  return currentToken
}
