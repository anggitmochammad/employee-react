import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "../api/client";
import { AppLink } from "../components/AppLink";
import type { NavigateHandler } from "../components/AppLink";
import { PageHeader } from "../components/PageHeader";
import { getEmployee } from "../features/employees/api";
import { employeeRoutes } from "../features/employees/routes";
import type { Employee } from "../types/employee";

type EmployeeDetailPageProps = {
  id: number;
  canEdit: boolean;
  onNavigate: NavigateHandler;
};

export function EmployeeDetailPage({
  id,
  canEdit,
  onNavigate,
}: EmployeeDetailPageProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const success = (window.history.state as { success?: unknown } | null)
    ?.success;
  const successMessage = typeof success === "string" ? success : null;
  const listHref = `${employeeRoutes.list}${window.location.search}`;

  useEffect(() => {
    const controller = new AbortController();
    getEmployee(id, controller.signal)
      .then(setEmployee)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError")
          return;
        setError(
          cause instanceof ApiError && cause.status === 404
            ? "Employee tidak ditemukan."
            : cause instanceof Error
              ? cause.message
              : "Detail employee gagal dimuat.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, retry]);

  const retryLoad = () => {
    setLoading(true);
    setError(null);
    setRetry((current) => current + 1);
  };

  return (
    <>
      <AppLink
        to={listHref}
        onNavigate={onNavigate}
        className="mb-6 inline-flex items-center text-sm font-medium text-indigo-700 hover:text-indigo-800 focus-visible:outline-2 focus-visible:outline-indigo-600"
      >
        <ArrowLeft
          aria-hidden="true"
          className="mr-2 inline size-4 align-text-bottom"
        />
        Kembali ke daftar
      </AppLink>
      <PageHeader
        eyebrow="Profil employee"
        title={employee ? employee.name : `Detail employee #${id}`}
        description="Informasi profil, department, dan status employee."
        action={
          employee && canEdit && !loading && !error ? (
            <AppLink
              to={`${employeeRoutes.edit(id)}${window.location.search}`}
              onNavigate={onNavigate}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              Ubah employee
            </AppLink>
          ) : undefined
        }
      />
      {successMessage && !loading && !error && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {successMessage}
        </p>
      )}
      {loading && (
        <div
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm"
        >
          Memuat detail employee...
        </div>
      )}
      {!loading && error && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-rose-900">
            Data tidak tersedia
          </h2>
          <p role="alert" className="mt-2 text-sm text-rose-700">
            {error}
          </p>
          <button
            type="button"
            onClick={retryLoad}
            className="mt-4 min-h-10 cursor-pointer rounded-xl bg-white px-4 text-sm font-semibold text-rose-800 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-rose-600"
          >
            Coba lagi
          </button>
        </section>
      )}
      {!loading && !error && employee && (
        <dl className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8">
          <Info label="Nama" value={employee.name} />
          <Info label="Email" value={employee.email} />
          <Info label="Telepon" value={employee.phone} />
          <Info label="Department" value={employee.department.name} />
          <Info label="Status" value={employee.status ? "Aktif" : "Nonaktif"} />
        </dl>
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-slate-900">
        {value}
      </dd>
    </div>
  );
}
