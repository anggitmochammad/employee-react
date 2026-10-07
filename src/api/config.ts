// Vite hanya mengekspos environment variable yang diawali VITE_ ke frontend.
// Nilai ini diisi dari .env.local, misalnya http://localhost:5000.
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

// Hapus slash terakhir supaya apiUrl('/api/...') tidak menghasilkan double slash.
// Jika kosong, fetch akan memakai origin yang sama dengan frontend.
export const apiBaseUrl = configuredBaseUrl?.replace(/\/+$/, '') ?? ''

// Semua endpoint API dipaksa diawali /api agar pemanggil tidak keliru menulis
// path yang tidak sesuai dengan kontrak backend.
export function apiUrl(path: `/api/${string}`): string {
  return `${apiBaseUrl}${path}`
}
