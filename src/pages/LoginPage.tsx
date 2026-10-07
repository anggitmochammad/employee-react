import { useState } from 'react'
import type { FormEvent } from 'react'
import { AppLink } from '../components/AppLink'
import type { NavigateHandler } from '../components/AppLink'

type LoginPageProps = {
  authenticated: boolean
  onLogin: (email: string, password: string) => Promise<void>
  onNavigate: NavigateHandler
}

export function LoginPage({ authenticated, onLogin, onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)

    try {
      await onLogin(email.trim(), password)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Login gagal. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-12 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div aria-hidden="true" className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl bg-indigo-600 text-xl font-bold text-white">E</div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Masuk ke akun Anda</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Akses direktori dan kelola data employee.</p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          {authenticated ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-slate-900">Anda sudah masuk</h2>
              <p className="mt-2 text-sm text-slate-600">Lanjutkan ke halaman employee.</p>
              <AppLink to="/employees" onNavigate={onNavigate} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700">
                Buka employee
              </AppLink>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@perusahaan.com"
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 pr-12 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-500 transition hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-600"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? 'Sedang masuk...' : 'Masuk'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 3 18 18M10.6 6.7A10.8 10.8 0 0 1 12 6.5c6.1 0 9.5 5.5 9.5 5.5a17.8 17.8 0 0 1-3 3.5M6.2 6.8C3.8 8.3 2.5 12 2.5 12S5.9 17.5 12 17.5c1 0 1.9-.2 2.7-.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}
