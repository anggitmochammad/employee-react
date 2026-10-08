import { useEffect, useState } from "react";
import { ScrollText } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Pagination } from "../components/Pagination";
import { getAuditLogs } from "../features/audit-logs/api";
import type { AuditLog } from "../features/audit-logs/api";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const actionLabels: Record<AuditLog["action"], string> = {
  create: "Tambah",
  update: "Ubah",
  delete: "Hapus",
};

function queryValue(name: string) {
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

function initialPage() {
  const value = Number(queryValue("page"));
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

function initialAction() {
  const value = queryValue("action");
  return value === "create" || value === "update" || value === "delete"
    ? value
    : "";
}

function initialUserId() {
  const value = queryValue("userId");
  return /^[1-9]\d*$/.test(value) ? value : "";
}

function initialDate(name: string) {
  const value = queryValue(name);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function localDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function AuditData({
  data,
  source,
}: {
  data: Record<string, unknown> | null;
  source?: AuditLog["entityDataSource"];
}) {
  if (!data) return <span className="text-slate-400">—</span>;

  return (
    <div className="max-w-56">
      <details>
        <summary className="cursor-pointer font-medium text-indigo-700 hover:text-indigo-900">
          Lihat data
        </summary>
        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
      {source === "current" && (
        <span className="mt-1 block text-xs text-amber-700">
          Data terkini, bukan snapshot saat aksi.
        </span>
      )}
    </div>
  );
}

export function AuditLogPage() {
  const [page, setPage] = useState(initialPage);
  const [action, setAction] = useState(initialAction);
  const [userId, setUserId] = useState(initialUserId);
  const [sortOrder, setSortOrder] = useState(() =>
    queryValue("sortOrder") === "asc" ? "asc" : "desc",
  );
  const [startDate, setStartDate] = useState(() => initialDate("startDate"));
  const [endDate, setEndDate] = useState(() => initialDate("endDate"));
  const [pageLogs, setPageLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getAuditLogs(page, controller.signal)
      .then((response) => {
        setPageLogs(response.data);
        setTotal(response.total);
        setTotalPages(Math.max(response.totalPages, 1));
        setError(null);
        if (page > Math.max(response.totalPages, 1)) {
          setLoading(true);
          setPage(Math.max(response.totalPages, 1));
        }
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError")
          return;
        setPageLogs([]);
        setError(
          cause instanceof Error ? cause.message : "Audit log gagal dimuat.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, retry]);

  const users = [
    ...new Map(pageLogs.map((log) => [log.userId, log.user])).entries(),
  ].sort((a, b) => a[1].name.localeCompare(b[1].name, "id"));

  const logs = pageLogs
    .filter((log) => {
      if (action && log.action !== action) return false;
      if (userId && String(log.userId) !== userId) return false;
      const date = localDateKey(log.createdAt);
      return (!startDate || date >= startDate) && (!endDate || date <= endDate);
    })
    .sort((a, b) => {
      const comparison =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === "asc"
        ? comparison || a.id - b.id
        : -comparison || b.id - a.id;
    });
  const hasFilters = Boolean(action || userId || startDate || endDate);

  useEffect(() => {
    if (loading || error) return;
    const query = new URLSearchParams();
    if (page > 1) query.set("page", String(page));
    if (action) query.set("action", action);
    if (userId) query.set("userId", userId);
    if (sortOrder === "asc") query.set("sortOrder", "asc");
    if (startDate) query.set("startDate", startDate);
    if (endDate) query.set("endDate", endDate);
    window.history.replaceState(
      window.history.state,
      "",
      `/audit-logs${query.size ? `?${query}` : ""}`,
    );
  }, [action, endDate, error, loading, page, sortOrder, startDate, userId]);

  const retryLoad = () => {
    setLoading(true);
    setError(null);
    setRetry((current) => current + 1);
  };

  const resetFilters = () => {
    setAction("");
    setUserId("");
    setSortOrder("desc");
    setStartDate("");
    setEndDate("");
  };

  return (
    <>
      <PageHeader
        eyebrow="Aktivitas admin"
        title="Audit log"
        description="Riwayat perubahan employee dan department."
      />
      <section
        aria-labelledby="audit-list-heading"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
          <h2
            id="audit-list-heading"
            className="text-base font-semibold text-slate-900"
          >
            Riwayat aktivitas
          </h2>
          {!loading && !error && (
            <p className="mt-1 text-sm text-slate-500">
              {logs.length} aktivitas ditampilkan pada halaman ini, dari {total}{" "}
              aktivitas.
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Filter dan urutan hanya berlaku pada halaman ini karena API audit
            log belum mendukung filter server-side.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <label className="block text-sm font-medium text-slate-700">
              Aktivitas
              <select
                value={action}
                onChange={(event) =>
                  setAction(event.target.value as typeof action)
                }
                className="mt-1 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Semua aktivitas</option>
                <option value="create">Tambah</option>
                <option value="update">Ubah</option>
                <option value="delete">Hapus</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              User
              <select
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="mt-1 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Semua user</option>
                {userId && !users.some(([id]) => String(id) === userId) && (
                  <option value={userId}>User #{userId} (halaman lain)</option>
                )}
                {users.map(([id, user]) => (
                  <option key={id} value={id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Urutan tanggal
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value as "asc" | "desc")
                }
                className="mt-1 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="desc">Terbaru dulu</option>
                <option value="asc">Terlama dulu</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Tanggal mulai
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-1 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Tanggal akhir
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-1 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          </div>
          {(hasFilters || sortOrder === "asc") && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 cursor-pointer text-sm font-semibold text-indigo-700 underline hover:text-indigo-900"
            >
              Reset filter
            </button>
          )}
        </div>
        {loading ? (
          <div
            role="status"
            className="grid min-h-72 place-items-center px-6 text-sm text-slate-500"
          >
            Memuat halaman audit log...
          </div>
        ) : error ? (
          <div className="p-6 sm:p-7">
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
            <button
              type="button"
              onClick={retryLoad}
              className="mt-3 min-h-10 cursor-pointer rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-600"
            >
              Coba lagi
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <ScrollText
              aria-hidden="true"
              className="mb-4 size-8 text-indigo-500"
            />
            <p className="font-semibold text-slate-900">
              {hasFilters
                ? "Tidak ada hasil pada halaman ini"
                : total > 0
                  ? "Tidak ada aktivitas pada halaman ini"
                  : "Belum ada aktivitas"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {hasFilters || total > 0
                ? "Coba ubah filter atau buka halaman lain."
                : "Perubahan data akan tercatat di sini."}
            </p>
          </div>
        ) : (
          <div
            role="region"
            aria-label="Tabel audit log"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold sm:px-7">Waktu</th>
                  <th className="px-5 py-3 font-semibold">Aktivitas</th>
                  <th className="px-5 py-3 font-semibold">Data</th>
                  <th className="px-5 py-3 font-semibold">Entity data</th>
                  <th className="px-5 py-3 font-semibold">Previous data</th>
                  <th className="px-5 py-3 font-semibold sm:px-7">
                    Dilakukan oleh
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600 sm:px-7">
                      <time dateTime={log.createdAt}>
                        {formatDate(log.createdAt)}
                      </time>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${log.action === "delete" ? "bg-rose-50 text-rose-700" : log.action === "create" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}
                      >
                        {actionLabels[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {log.entity === "employee" ? "Employee" : "Department"} #
                      {log.entityId}
                    </td>
                    <td className="px-5 py-4">
                      <AuditData
                        data={log.entityData}
                        source={log.entityDataSource}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <AuditData data={log.previousData} />
                    </td>
                    <td className="px-5 py-4 sm:px-7">
                      <span className="block font-medium text-slate-900">
                        {log.user.name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {log.user.email}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && (
          <Pagination
            page={page}
            totalPages={totalPages}
            label="Halaman audit log"
            onPageChange={(nextPage) => {
              setLoading(true);
              setPage(nextPage);
            }}
          />
        )}
      </section>
    </>
  );
}
