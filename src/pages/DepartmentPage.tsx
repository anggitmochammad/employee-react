import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Building2, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { ApiError } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
} from "../features/departments/api";
import type { Department } from "../types/employee";

export function DepartmentPage({ canEdit }: { canEdit: boolean }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const visibleDepartments = departments.filter((department) =>
    department.name
      .toLocaleLowerCase("id")
      .includes(search.trim().toLocaleLowerCase("id")),
  );

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

  useEffect(() => {
    const controller = new AbortController();
    getDepartments(controller.signal)
      .then((data) => {
        setDepartments(data);
        setLoadError(null);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError")
          return;
        setLoadError(
          cause instanceof Error ? cause.message : "Department gagal dimuat.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);

  const retryLoad = () => {
    setLoading(true);
    setLoadError(null);
    setRetry((current) => current + 1);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setActionError("Nama department wajib diisi.");
      return;
    }
    setSaving(true);
    setActionError(null);
    setSuccess(null);
    try {
      const created = await createDepartment(trimmedName);
      setDepartments((current) =>
        [...current, created].sort((a, b) => a.id - b.id),
      );
      setName("");
      setSuccess(`Department ${created.name} berhasil ditambahkan.`);
    } catch (cause) {
      setActionError(
        cause instanceof Error
          ? cause.message
          : "Department gagal ditambahkan.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (
    event: FormEvent<HTMLFormElement>,
    department: Department,
  ) => {
    event.preventDefault();
    if (saving) return;
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setActionError("Nama department wajib diisi.");
      return;
    }
    if (trimmedName === department.name.trim()) {
      setActionError("Ubah nama department sebelum menyimpan.");
      return;
    }
    setSaving(true);
    setActionError(null);
    setSuccess(null);
    try {
      const updated = await updateDepartment(department.id, trimmedName);
      setDepartments((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditingId(null);
      setSuccess(`Department ${updated.name} berhasil diubah.`);
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Department gagal diubah.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (department: Department) => {
    if (deletingId !== null) return;
    setDeletingId(department.id);
    setActionError(null);
    setSuccess(null);
    try {
      await deleteDepartment(department.id);
      setDepartments((current) =>
        current.filter((item) => item.id !== department.id),
      );
      setSuccess(`Department ${department.name} berhasil dihapus.`);
    } catch (cause) {
      setActionError(
        cause instanceof ApiError && cause.status === 409
          ? "Department masih memiliki employee dan tidak dapat dihapus."
          : cause instanceof Error
            ? cause.message
            : "Department gagal dihapus.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Organisasi"
        title="Department"
        description="Lihat dan kelola department yang digunakan pada data employee."
      />
      {canEdit && (
        <form
          onSubmit={(event) => void handleCreate(event)}
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <label
            htmlFor="new-department-name"
            className="block text-sm font-medium text-slate-700"
          >
            Nama department baru
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="new-department-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              disabled={saving}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              placeholder="Contoh: Human Resources"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60"
            >
              {saving && editingId === null ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : (
                <Plus aria-hidden="true" className="size-4" />
              )}
              Tambah department
            </button>
          </div>
        </form>
      )}
      {success && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {success}
        </p>
      )}
      {actionError && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {actionError}
        </p>
      )}
      <section
        aria-labelledby="department-list-heading"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
          <div>
            <h2
              id="department-list-heading"
              className="text-base font-semibold text-slate-900"
            >
              Daftar department
            </h2>
            {!loading && !loadError && (
              <p className="mt-1 text-sm text-slate-500">
                {visibleDepartments.length} dari {departments.length} department
                ditampilkan.
              </p>
            )}
          </div>
          <label
            htmlFor="department-search"
            className="block w-full text-sm font-medium text-slate-700 sm:w-72"
          >
            Cari department
            <input
              id="department-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setEditingId(null);
              }}
              placeholder="Nama department"
              className="mt-1 min-h-10 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>
        {loading ? (
          <div
            role="status"
            className="grid min-h-52 place-items-center px-6 text-sm text-slate-500"
          >
            Memuat department...
          </div>
        ) : loadError ? (
          <div className="p-6 sm:p-7">
            <p role="alert" className="text-sm text-rose-700">
              {loadError}
            </p>
            <button
              type="button"
              onClick={retryLoad}
              className="mt-3 min-h-10 cursor-pointer rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-600"
            >
              Coba lagi
            </button>
          </div>
        ) : visibleDepartments.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
            <Building2
              aria-hidden="true"
              className="mb-4 size-8 text-indigo-500"
            />
            <p className="font-semibold text-slate-900">
              {search.trim() ? "Tidak ada hasil" : "Belum ada department"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {search.trim()
                ? "Coba ubah kata kunci pencarian."
                : "Department yang dibuat akan muncul di sini."}
            </p>
          </div>
        ) : (
          <div
            role="region"
            aria-label="Tabel department"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold sm:px-7">Nama</th>
                  <th className="px-5 py-3 font-semibold">ID</th>
                  {canEdit && (
                    <th className="px-5 py-3 text-right font-semibold sm:px-7">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleDepartments.map((department) => (
                  <tr key={department.id}>
                    <td className="px-5 py-3 sm:px-7">
                      {editingId === department.id ? (
                        <form
                          id={`edit-department-${department.id}`}
                          onSubmit={(event) =>
                            void handleUpdate(event, department)
                          }
                        >
                          <label
                            htmlFor="edit-department-name"
                            className="sr-only"
                          >
                            Ubah nama {department.name}
                          </label>
                          <input
                            ref={editInputRef}
                            id="edit-department-name"
                            value={editingName}
                            onChange={(event) =>
                              setEditingName(event.target.value)
                            }
                            required
                            disabled={saving}
                            className="min-h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                          />
                          {editingName.trim() === department.name.trim() && (
                            <p className="mt-1 text-xs text-slate-500">
                              Ubah nama untuk mengaktifkan Simpan.
                            </p>
                          )}
                        </form>
                      ) : (
                        <span className="font-medium text-slate-900">
                          {department.name}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {department.id}
                    </td>
                    {canEdit && (
                      <td className="px-5 py-3 sm:px-7">
                        <div className="flex items-center justify-end gap-1">
                          {editingId === department.id ? (
                            <>
                              <button
                                form={`edit-department-${department.id}`}
                                type="submit"
                                disabled={
                                  saving ||
                                  !editingName.trim() ||
                                  editingName.trim() === department.name.trim()
                                }
                                className="min-h-10 cursor-pointer rounded-lg px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => setEditingId(null)}
                                className="min-h-10 cursor-pointer rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                aria-label={`Ubah ${department.name}`}
                                title="Ubah"
                                disabled={saving || deletingId !== null}
                                onClick={() => {
                                  setEditingId(department.id);
                                  setEditingName(department.name);
                                  setActionError(null);
                                  setSuccess(null);
                                }}
                                className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                              >
                                <Pencil aria-hidden="true" className="size-4" />
                              </button>
                              <AlertDialog.Root>
                                <AlertDialog.Trigger asChild>
                                  <button
                                    type="button"
                                    aria-label={`Hapus ${department.name}`}
                                    title="Hapus"
                                    disabled={saving || deletingId !== null}
                                    className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {deletingId === department.id ? (
                                      <LoaderCircle
                                        aria-hidden="true"
                                        className="size-4 animate-spin"
                                      />
                                    ) : (
                                      <Trash2
                                        aria-hidden="true"
                                        className="size-4"
                                      />
                                    )}
                                  </button>
                                </AlertDialog.Trigger>
                                <AlertDialog.Portal>
                                  <AlertDialog.Overlay className="fixed inset-0 z-40 bg-slate-950/50" />
                                  <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl focus:outline-none">
                                    <AlertDialog.Title className="text-lg font-semibold text-slate-950">
                                      Hapus department?
                                    </AlertDialog.Title>
                                    <AlertDialog.Description className="mt-2 text-sm leading-6 text-slate-600">
                                      Department {department.name} akan dihapus.
                                      Department yang masih memiliki employee
                                      tidak dapat dihapus.
                                    </AlertDialog.Description>
                                    <div className="mt-6 flex justify-end gap-3">
                                      <AlertDialog.Cancel asChild>
                                        <button
                                          type="button"
                                          className="min-h-10 cursor-pointer rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                          Batal
                                        </button>
                                      </AlertDialog.Cancel>
                                      <AlertDialog.Action asChild>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void handleDelete(department)
                                          }
                                          className="min-h-10 cursor-pointer rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700"
                                        >
                                          Hapus department
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
