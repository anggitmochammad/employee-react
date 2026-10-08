import { useEffect, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
} from "lucide-react";
import { ApiError } from "../api/client";
import { AppLink } from "../components/AppLink";
import type { NavigateHandler } from "../components/AppLink";
import { PageHeader } from "../components/PageHeader";
import { getDepartments } from "../features/departments/api";
import {
  deleteEmployee,
  getEmployees,
} from "../features/employees/api";
import { employeeRoutes } from "../features/employees/routes";
import type { Department, Employee } from "../types/employee";

type EmployeeListPageProps = { canEdit: boolean; onNavigate: NavigateHandler };
const pageLimit = 10;
const initialQuery = () => new URLSearchParams(window.location.search);

function initialPage() {
  const value = Number(initialQuery().get("page"));
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

function initialDepartmentId() {
  const value = initialQuery().get("departmentId") ?? "";
  return /^[1-9]\d*$/.test(value) ? value : "";
}

function initialStatus() {
  const value = initialQuery().get("status");
  return value === "true" || value === "false" ? value : "";
}

export function EmployeeListPage({
  canEdit,
  onNavigate,
}: EmployeeListPageProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(initialPage);
  const [searchInput, setSearchInput] = useState(() => initialQuery().get("search") ?? "");
  const [search, setSearch] = useState(() => initialQuery().get("search") ?? "");
  const [departmentId, setDepartmentId] = useState(initialDepartmentId);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [departmentRetry, setDepartmentRetry] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (searchInput.trim() === search) return;
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
      setLoading(true);
      setError(null);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [searchInput, search]);

  const query = new URLSearchParams();
  if (page > 1) query.set("page", String(page));
  if (search) query.set("search", search);
  if (departmentId) query.set("departmentId", departmentId);
  if (status) query.set("status", status);
  const listQuery = query.size ? `?${query.toString()}` : "";

  useEffect(() => {
    window.history.replaceState(window.history.state, "", `${employeeRoutes.list}${listQuery}`);
  }, [listQuery]);

  useEffect(() => {
    const controller = new AbortController();
    getDepartments(controller.signal)
      .then((data) => {
        setDepartments(data);
        setDepartmentError(null);
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError"))
          setDepartmentError(
            cause instanceof Error ? cause.message : "Department gagal dimuat.",
          );
      });
    return () => controller.abort();
  }, [departmentRetry]);

  useEffect(() => {
    const controller = new AbortController();
    getEmployees(
      {
        page,
        limit: pageLimit,
        search,
        departmentId: departmentId ? Number(departmentId) : undefined,
        status: status === "" ? undefined : status === "true",
      },
      controller.signal,
    )
      .then((response) => {
        setEmployees(response.data);
        setTotal(response.total);
        setTotalPages(Math.max(response.totalPages, 1));
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) {
          setEmployees([]);
          setError(
            cause instanceof Error
              ? cause.message
              : "Daftar employee gagal dimuat.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [departmentId, page, retry, search, status]);

  const handleFilterChange = (
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value);
    setPage(1);
    setLoading(true);
    setError(null);
  };

  const handleDelete = async (employee: Employee) => {
    setDeletingId(employee.id);
    setError(null);
    try {
      await deleteEmployee(employee.id);
      if (employees.length === 1 && page > 1) {
        setLoading(true);
        setPage((current) => current - 1);
      } else {
        setLoading(true);
        setRetry((current) => current + 1);
      }
      setEmployees((current) => current.filter((item) => item.id !== employee.id));
      setTotal((current) => Math.max(current - 1, 0));
      setSuccess(`${employee.name} berhasil dihapus.`);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Employee gagal dihapus.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const retryList = () => {
    setLoading(true);
    setError(null);
    setRetry((current) => current + 1);
  };

  return (
    <>
      <PageHeader
        eyebrow="Direktori"
        title="Employee"
        description="Kelola informasi dan status anggota tim dalam satu tempat."
      />
      <section
        aria-labelledby="employee-list-heading"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-7 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2
              id="employee-list-heading"
              className="text-base font-semibold text-slate-900"
            >
              Daftar employee
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {error && employees.length === 0
                ? "Daftar belum dapat dimuat."
                : `${total} employee ditemukan.`}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="block min-w-56">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cari
              </span>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Nama atau email"
                className="min-h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="block min-w-44">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Department
              </span>
              <select
                value={departmentId}
                onChange={(event) =>
                  handleFilterChange(setDepartmentId, event.target.value)
                }
                className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Semua department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-36">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </span>
              <select
                value={status}
                onChange={(event) =>
                  handleFilterChange(setStatus, event.target.value)
                }
                className="min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Semua status</option>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </label>
            {canEdit && (
              <AppLink
                to={`${employeeRoutes.create}${listQuery}`}
                onNavigate={onNavigate}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus aria-hidden="true" className="mr-2 size-4" strokeWidth={2.25} />
                Tambah employee
              </AppLink>
            )}
          </div>
        </div>
        {departmentError && (
          <div role="alert" className="mx-5 mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-7">
            Pilihan department gagal dimuat: {departmentError}
            <button type="button" onClick={() => setDepartmentRetry((current) => current + 1)} className="ml-2 cursor-pointer font-semibold underline focus-visible:outline-2 focus-visible:outline-rose-600">
              Coba lagi
            </button>
          </div>
        )}
        {success && (
          <p role="status" className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:mx-7">
            {success}
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="m-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {error}
            <button
              type="button"
              onClick={retryList}
              className="ml-3 cursor-pointer font-semibold underline focus-visible:outline-2 focus-visible:outline-rose-600"
            >
              Coba lagi
            </button>
          </div>
        )}
        {loading ? (
          <div
            role="status"
            className="flex min-h-72 items-center justify-center px-6 text-sm text-slate-500"
          >
            Memuat employee...
          </div>
        ) : error && employees.length === 0 ? null : employees.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <div
              aria-hidden="true"
              className="mb-5 grid size-14 place-items-center rounded-2xl bg-indigo-50"
            >
              <UsersRound aria-hidden="true" className="size-7 text-indigo-600" strokeWidth={1.8} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {search || departmentId || status
                ? "Tidak ada hasil"
                : "Belum ada employee"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search || departmentId || status
                ? "Coba ubah kata kunci atau filter Anda."
                : "Belum ada data employee yang tersimpan."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-indigo-600" role="region" aria-label="Tabel employee" tabIndex={0}>
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold sm:px-7">Nama</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold sm:px-7">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 sm:px-7">
                      <AppLink
                        to={`${employeeRoutes.detail(employee.id)}${listQuery}`}
                        onNavigate={onNavigate}
                        className="font-semibold text-slate-900 hover:text-indigo-700"
                      >
                        {employee.name}
                      </AppLink>
                      <p className="mt-1 text-xs text-slate-500">
                        {employee.email}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {employee.department.name}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${employee.status ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {employee.status ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-5 py-4 sm:px-7">
                      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        <AppLink
                          aria-label={`Lihat detail ${employee.name}`}
                          title="Detail"
                          to={`${employeeRoutes.detail(employee.id)}${listQuery}`}
                          onNavigate={onNavigate}
                          className="inline-flex size-11 items-center justify-center rounded-lg text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 focus-visible:outline-2 focus-visible:outline-indigo-600"
                        >
                          <Eye aria-hidden="true" className="size-4" />
                        </AppLink>
                        {canEdit && (
                          <>
                            <AppLink
                              aria-label={`Ubah ${employee.name}`}
                              title="Ubah"
                              to={`${employeeRoutes.edit(employee.id)}${listQuery}`}
                              onNavigate={onNavigate}
                              className="inline-flex size-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-indigo-600"
                            >
                              <Pencil aria-hidden="true" className="size-4" />
                            </AppLink>
                            <AlertDialog.Root>
                              <AlertDialog.Trigger asChild>
                                <button
                                  type="button"
                                  aria-label={`Hapus ${employee.name}`}
                                  title="Hapus"
                                  disabled={deletingId !== null}
                                  className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-rose-700 hover:bg-rose-50 hover:text-rose-900 focus-visible:outline-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {deletingId === employee.id ? (
                                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                                  ) : (
                                    <Trash2 aria-hidden="true" className="size-4" />
                                  )}
                                </button>
                              </AlertDialog.Trigger>
                              <AlertDialog.Portal>
                                <AlertDialog.Overlay className="fixed inset-0 z-40 bg-slate-950/50" />
                                <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none">
                                  <AlertDialog.Title className="text-lg font-semibold text-slate-950">
                                    Hapus employee?
                                  </AlertDialog.Title>
                                  <AlertDialog.Description className="mt-2 text-sm leading-6 text-slate-600">
                                    Data {employee.name} akan dihapus. Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialog.Description>
                                  <div className="mt-6 flex justify-end gap-3">
                                    <AlertDialog.Cancel asChild>
                                      <button type="button" className="min-h-10 cursor-pointer rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">
                                        Batal
                                      </button>
                                    </AlertDialog.Cancel>
                                    <AlertDialog.Action asChild>
                                      <button type="button" onClick={() => void handleDelete(employee)} className="min-h-10 cursor-pointer rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-rose-600">
                                        Hapus employee
                                      </button>
                                    </AlertDialog.Action>
                                  </div>
                                </AlertDialog.Content>
                              </AlertDialog.Portal>
                            </AlertDialog.Root>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-slate-500">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setPage((current) => current - 1);
                }}
                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft aria-hidden="true" className="mr-1 size-4" />
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  setPage((current) => current + 1);
                }}
                className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Berikutnya
                <ChevronRight aria-hidden="true" className="ml-1 size-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
