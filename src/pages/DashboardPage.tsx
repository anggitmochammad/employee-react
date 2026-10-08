import { AppLink } from "../components/AppLink";
import type { NavigateHandler } from "../components/AppLink";
import { PageHeader } from "../components/PageHeader";

export function DashboardPage({ onNavigate }: { onNavigate: NavigateHandler }) {
  return (
    <>
      <PageHeader
        eyebrow="Ringkasan"
        title="Dashboard"
        description="Akses cepat ke area pengelolaan employee."
      />
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Employee management
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            Kelola direktori tim
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Lihat daftar, detail, dan ubah data employee dari satu tempat.
          </p>
          <AppLink
            to="/employees"
            onNavigate={onNavigate}
            className="mt-5 inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Buka daftar employee
          </AppLink>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Akses cepat</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            Tambah employee
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Buat profil employee baru jika akun Anda memiliki akses admin.
          </p>
          <AppLink
            to="/employees/new"
            onNavigate={onNavigate}
            className="mt-5 inline-flex min-h-10 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Tambah employee
          </AppLink>
        </article>
      </section>
    </>
  );
}
