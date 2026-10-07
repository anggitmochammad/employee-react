import type { ReactNode } from 'react'
import type { AuthUser } from '../auth/api'
import { AppLink } from './AppLink'
import type { NavigateHandler } from './AppLink'

type LayoutAdminProps = {
  activePage: string
  children: ReactNode
  user: AuthUser | null
  onLogout: () => void
  onNavigate: NavigateHandler
}

// Layout utama setelah user berhasil login. Halaman employee dirender melalui
// children, sementara header, navigasi, informasi user, dan logout tetap sama.
export function LayoutAdmin({ activePage, children, user, onLogout, onNavigate }: LayoutAdminProps) {
  const employeeActive = activePage.startsWith('employee')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <AppLink to="/employees" onNavigate={onNavigate} className="flex items-center gap-3 font-semibold tracking-tight text-slate-950">
            <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white">E</span>
            <span>Employee Management</span>
          </AppLink>
          <nav aria-label="Navigasi utama" className="flex items-center gap-2 text-sm">
            <AppLink
              to="/employees"
              onNavigate={onNavigate}
              aria-current={employeeActive ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 font-medium ${employeeActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Employee
            </AppLink>
            {user?.email && <span className="hidden max-w-44 truncate text-slate-500 md:inline" title={user.email}>{user.email}</span>}
            <button type="button" onClick={onLogout} className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50">Keluar</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  )
}
