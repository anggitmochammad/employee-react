import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Building2,
  Clock3,
  History,
  RefreshCw,
  Users,
} from "lucide-react";
import { AppLink } from "../components/AppLink";
import type { NavigateHandler } from "../components/AppLink";
import { PageHeader } from "../components/PageHeader";
import { getAuditLogs } from "../features/audit-logs/api";
import type { AuditLog } from "../features/audit-logs/api";
import { getDepartments } from "../features/departments/api";
import { getEmployees } from "../features/employees/api";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const actionLabels: Record<AuditLog["action"], string> = {
  create: "menambahkan",
  update: "mengubah",
  delete: "menghapus",
};

const actionBadgeLabels: Record<AuditLog["action"], string> = {
  create: "Tambah",
  update: "Ubah",
  delete: "Hapus",
};

const actionStyles: Record<AuditLog["action"], string> = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-indigo-100 text-indigo-700",
  delete: "bg-rose-100 text-rose-700",
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Data gagal dimuat.";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

export function DashboardPage({
  canEdit,
  onNavigate,
}: {
  canEdit: boolean;
  onNavigate: NavigateHandler;
}) {
  const [departmentTotal, setDepartmentTotal] = useState<number | null>(null);
  const [employeeTotal, setEmployeeTotal] = useState<number | null>(null);
  const [recentActivities, setRecentActivities] = useState<AuditLog[]>([]);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      setLoading(true);
      setSummaryError(null);
      setActivityError(null);

      const [departmentResult, employeeResult, activityResult] =
        await Promise.allSettled([
          getDepartments(controller.signal),
          getEmployees({ page: 1, limit: 1 }, controller.signal),
          canEdit
            ? getAuditLogs(1, controller.signal)
            : Promise.resolve(null),
        ]);

      if (controller.signal.aborted) return;

      if (departmentResult.status === "fulfilled") {
        setDepartmentTotal(departmentResult.value.length);
      } else {
        setDepartmentTotal(null);
      }

      if (employeeResult.status === "fulfilled") {
        setEmployeeTotal(employeeResult.value.total);
      } else {
        setEmployeeTotal(null);
      }

      const summaryErrors = [departmentResult, employeeResult]
        .filter((result) => result.status === "rejected")
        .map((result) =>
          result.status === "rejected" ? errorMessage(result.reason) : "",
        );
      setSummaryError(summaryErrors[0] ?? null);

      if (activityResult.status === "fulfilled") {
        setRecentActivities(activityResult.value?.data.slice(0, 5) ?? []);
      } else {
        setRecentActivities([]);
        setActivityError(errorMessage(activityResult.reason));
      }

      setLoading(false);
    }

    void loadDashboard();
    return () => controller.abort();
  }, [canEdit, retryCount]);

  return (
    <>
      <PageHeader
        eyebrow="Ringkasan"
        title="Dashboard"
        description="Informasi singkat data organisasi dan aktivitas terbaru."
        action={
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              className={`size-4 ${loading ? "animate-spin" : ""}`}
            />
            Perbarui
          </button>
        }
      />

      <section aria-label="Ringkasan data" className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          title="Jumlah department"
          value={departmentTotal}
          loading={loading}
          icon={<Building2 aria-hidden="true" className="size-6" />}
          href="/departments"
          linkLabel="Lihat department"
          onNavigate={onNavigate}
        />
        <SummaryCard
          title="Jumlah employee"
          value={employeeTotal}
          loading={loading}
          icon={<Users aria-hidden="true" className="size-6" />}
          href="/employees"
          linkLabel="Lihat employee"
          onNavigate={onNavigate}
        />
      </section>

      {summaryError && (
        <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Sebagian ringkasan gagal dimuat: {summaryError}
        </p>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="recent-activity-heading">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2 text-slate-950">
              <History aria-hidden="true" className="size-5 text-indigo-600" />
              <h2 id="recent-activity-heading" className="text-lg font-semibold">
                Aktivitas terakhir
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Perubahan terbaru pada employee dan department.
            </p>
          </div>
          {canEdit && (
            <AppLink to="/audit-logs" onNavigate={onNavigate} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">
              Lihat semua aktivitas
            </AppLink>
          )}
        </div>

        {!canEdit ? (
          <div className="px-5 py-10 text-center sm:px-6">
            <History aria-hidden="true" className="mx-auto size-9 text-slate-300" />
            <p className="mt-3 font-medium text-slate-800">Aktivitas hanya tersedia untuk admin</p>
            <p className="mt-1 text-sm text-slate-500">
              Akun viewer tidak memiliki akses ke audit log.
            </p>
          </div>
        ) : loading ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">
            Memuat aktivitas terbaru...
          </p>
        ) : activityError ? (
          <p role="alert" className="px-5 py-10 text-center text-sm text-rose-700 sm:px-6">
            Aktivitas gagal dimuat: {activityError}
          </p>
        ) : recentActivities.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500 sm:px-6">
            Belum ada aktivitas yang tercatat.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentActivities.map((activity) => (
              <li key={activity.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`mt-0.5 inline-flex shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${actionStyles[activity.action]}`}>
                    {actionBadgeLabels[activity.action]}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-950">{activity.user.name}</span>{" "}
                      {actionLabels[activity.action]} {activity.entity === "employee" ? "employee" : "department"} #{activity.entityId}.
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">{activity.user.email}</p>
                  </div>
                </div>
                <time dateTime={activity.createdAt} className="flex shrink-0 items-center gap-1.5 pl-0 text-xs text-slate-500 sm:pl-3">
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  {formatDate(activity.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function SummaryCard({
  title,
  value,
  loading,
  icon,
  href,
  linkLabel,
  onNavigate,
}: {
  title: string;
  value: number | null;
  loading: boolean;
  icon: ReactNode;
  href: string;
  linkLabel: string;
  onNavigate: NavigateHandler;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-950" aria-live="polite">
            {loading && value === null ? "..." : (value ?? "—")}
          </p>
        </div>
        <span className="grid size-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </span>
      </div>
      <AppLink to={href} onNavigate={onNavigate} className="mt-5 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-900">
        {linkLabel}
      </AppLink>
    </article>
  );
}
