import { AppLink } from '../components/AppLink'
import type { NavigateHandler } from '../components/AppLink'
import { PageHeader } from '../components/PageHeader'

type NotFoundPageProps = {
  authenticated: boolean
  onNavigate: NavigateHandler
}

export function NotFoundPage({ authenticated, onNavigate }: NotFoundPageProps) {
  const destination = authenticated ? '/employees' : '/login'
  const label = authenticated ? 'Kembali ke daftar employee' : 'Kembali ke halaman login'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
      <PageHeader eyebrow="404" title="Halaman tidak ditemukan" description="Alamat yang Anda buka tidak tersedia." />
      <AppLink to={destination} onNavigate={onNavigate} className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700">
        {label}
      </AppLink>
    </div>
  )
}
