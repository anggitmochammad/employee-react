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

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
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
  }, [id]);

  return (
    <>
      <AppLink
        to={employeeRoutes.list}
        onNavigate={onNavigate}
        className="mb-6 inline-flex text-sm font-medium text-indigo-700 hover:text-indigo-800"
      >
        <ArrowLeft aria-hidden="true" className="mr-2 inline size-4 align-text-bottom" />
        Kembali ke daftar
      </AppLink>
      <PageHeader
        eyebrow="Profil employee"
        title={employee ? employee.name : `Detail employee #${id}`}
        description="Informasi profil, department, dan status employee."
        action={
          employee && canEdit ? (
            <AppLink
              to={employeeRoutes.edit(id)}
              onNavigate={onNavigate}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Ubah employee
            </AppLink>
          ) : undefined
        }
      />
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
        </section>
      )}
      {!loading && !error && employee && (
        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8">
          <Info label="Nama" value={employee.name} />
          <Info label="Email" value={employee.email} />
          <Info label="Telepon" value={employee.phone} />
          <Info label="Department" value={employee.department.name} />
          <Info label="Status" value={employee.status ? "Aktif" : "Nonaktif"} />
        </section>
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
      <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}
