import { ApiError, apiRequest } from '../api/client'

export type AuthUser = {
  email: string | null
  name: string | null
  role: 'admin' | 'viewer' | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

export async function login(email: string, password: string): Promise<string> {
  const response = await apiRequest<unknown>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  })
  const data = asRecord(response)
  const token = data?.access_token ?? data?.accessToken

  if (typeof token !== 'string' || !token.trim()) {
    throw new ApiError('Format respons login belum sesuai dokumentasi. Hubungi pengelola API.', 502)
  }

  return token
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  const response = await apiRequest<unknown>('/api/auth/me', { signal })
  const data = asRecord(response)
  const nestedUser = asRecord(data?.user)
  const user = nestedUser ?? data
  const role = user?.role

  return {
    email: typeof user?.email === 'string' ? user.email : null,
    name: typeof user?.name === 'string' ? user.name : null,
    role: role === 'admin' || role === 'viewer' ? role : null,
  }
}
