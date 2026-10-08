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
  let token: string | null = null

  try {
    token = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // Coba sesi lama jika shared storage tidak tersedia.
  }

  if (!token) {
    try {
      token = window.sessionStorage.getItem(STORAGE_KEY)
      if (token) {
        // Migrasikan sesi versi lama agar tautan di tab baru tetap terautentikasi.
        window.localStorage.setItem(STORAGE_KEY, token)
        window.sessionStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Token tetap null jika browser memblokir penyimpanan.
    }
  }

  if (token && isTokenExpired(token)) {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Token kedaluwarsa tetap ditolak walau storage tidak dapat dibersihkan.
    }
    return null
  }

  return token
}

let currentToken = readInitialToken()
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function handleStorageChange(event: StorageEvent) {
  if (event.key !== STORAGE_KEY || event.storageArea !== window.localStorage) return

  let nextToken = event.newValue
  if (nextToken && isTokenExpired(nextToken)) {
    nextToken = null
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nilai in-memory tetap dibersihkan jika storage tidak tersedia.
    }
  }

  if (currentToken !== nextToken) {
    currentToken = nextToken
    emitChange()
  }
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  if (listeners.size === 1) window.addEventListener('storage', handleStorageChange)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', handleStorageChange)
  }
}

export function getSessionToken(): string | null {
  return currentToken
}

export function saveSessionToken(token: string): void {
  window.localStorage.setItem(STORAGE_KEY, token)
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Sesi baru tetap valid jika penyimpanan versi lama tidak dapat dibersihkan.
  }
  currentToken = token
  emitChange()
}

export function clearSessionToken(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // The in-memory session must still be cleared if storage is unavailable.
  }
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
