import { apiUrl } from './config'
import { clearSessionToken, getSessionToken, getUsableToken } from '../auth/session'

export class ApiError extends Error {
  // Status HTTP dipertahankan agar halaman dapat membedakan 401, 403, 404,
  // dan error jaringan (status 0).
  status: number
  details: string[]

  constructor(message: string, status: number, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type ApiOptions = RequestInit & { auth?: boolean }

// Pesan cadangan dipakai jika backend tidak mengirim body error yang berisi
// properti message atau jika body bukan JSON.
const fallbackMessages: Record<number, string> = {
  400: 'Data yang dikirim tidak valid.',
  401: 'Sesi tidak valid. Silakan masuk kembali.',
  403: 'Anda tidak memiliki akses untuk tindakan ini.',
  404: 'Data tidak ditemukan.',
  409: 'Data sudah digunakan.',
}

function readErrorMessage(body: unknown): string | null {
  // Backend dapat mengirim message sebagai string atau array string validasi.
  // Parser ini sengaja aman terhadap bentuk body lain.
  if (typeof body !== 'object' || body === null || !('message' in body)) return null
  const message = body.message
  if (typeof message === 'string' && message.trim()) return message
  if (Array.isArray(message)) {
    const items = message.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    return items.length > 0 ? items.join(' ') : null
  }
  return null
}

function readErrorDetails(body: unknown): string[] {
  if (typeof body !== 'object' || body === null || !('errors' in body)) return []
  const errors = body.errors
  return Array.isArray(errors) ? errors.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : []
}

export async function apiRequest<T>(path: `/api/${string}`, options: ApiOptions = {}): Promise<T> {
  // Satu pintu untuk semua request API: menyiapkan header, JWT, fetch, dan
  // normalisasi error. T adalah tipe response yang diharapkan oleh pemanggil.
  const { auth = true, ...init } = options
  const headers = new Headers(init.headers)
  let requestToken: string | null = null

  // Request dengan body string berasal dari JSON.stringify(), jadi tambahkan
  // Content-Type secara otomatis jika caller belum menetapkannya.
  if (typeof init.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  if (auth) {
    // Endpoint terlindungi wajib memiliki JWT aktif. getUsableToken juga
    // menghapus token yang sudah kedaluwarsa dari session.
    requestToken = getUsableToken()
    if (!requestToken) throw new ApiError('Silakan masuk untuk melanjutkan.', 401)
    headers.set('Authorization', `Bearer ${requestToken}`)
  }

  let response: Response
  try {
    // auth: false dipakai untuk login; request lain secara default memakai JWT.
    response = await fetch(apiUrl(path), { ...init, headers })
  } catch (error) {
    // AbortError harus diteruskan agar caller dapat membatalkan request tanpa
    // menampilkan pesan error jaringan biasa.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi Anda.', 0)
  }

  if (!response.ok) {
    // Hanya hapus token yang dipakai oleh request ini. Ini mencegah request lama
    // menghapus sesi baru jika user sudah login ulang saat request berjalan.
    if (auth && response.status === 401 && getSessionToken() === requestToken) clearSessionToken()
    const body = await response.json().catch(() => null) as unknown
    const details = readErrorDetails(body)
    throw new ApiError(readErrorMessage(body) ?? (details.join(' ') || fallbackMessages[response.status] || 'Permintaan gagal. Coba lagi.'), response.status, details)
  }

  // DELETE mengembalikan 204 tanpa body, jadi jangan mencoba response.json().
  if (response.status === 204) return undefined as T

  try {
    // Semua response sukses lain diharapkan berupa JSON sesuai kontrak API.
    return await response.json() as T
  } catch {
    throw new ApiError('Respons server tidak dapat dibaca.', response.status)
  }
}
