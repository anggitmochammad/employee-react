import { useEffect, useState, useSyncExternalStore } from "react";
import type { MouseEvent, ReactNode } from "react";
import { ApiError } from "./api/client";
import { getCurrentUser, login } from "./auth/api";
import type { AuthUser } from "./auth/api";
import {
  clearSessionToken,
  getSessionToken,
  getUsableToken,
  saveSessionToken,
  subscribeSession,
} from "./auth/session";
import { LayoutAdmin } from "./components/LayoutAdmin";
import { EmployeeDetailPage } from "./pages/EmployeeDetailPage";
import { EmployeeFormPage } from "./pages/EmployeeFormPage";
import { EmployeeListPage } from "./pages/EmployeeListPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DepartmentPage } from "./pages/DepartmentPage";
import { AuditLogPage } from "./pages/AuditLogPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";

type Route =
  | { page: "login" }
  | { page: "employees" }
  | { page: "dashboard" }
  | { page: "departments" }
  | { page: "audit-logs" }
  | { page: "employee-new" }
  | { page: "employee-detail"; id: number }
  | { page: "employee-edit"; id: number }
  | { page: "not-found" };

type Verification = {
  token: string | null;
  status: "ready" | "error";
  user: AuthUser | null;
  message?: string;
};

// Router sederhana aplikasi. Project ini belum memakai react-router, jadi URL
// dicocokkan sendiri lewat matchRoute() dan perubahan history ditangani di bawah.
function matchRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/login") return { page: "login" };
  if (path === "/") return { page: "dashboard" };
  if (path === "/dashboard") return { page: "dashboard" };
  if (path === "/departments") return { page: "departments" };
  if (path === "/audit-logs") return { page: "audit-logs" };
  if (path === "/employees") return { page: "employees" };
  if (path === "/employees/new") return { page: "employee-new" };

  const editMatch = /^\/employees\/([1-9]\d*)\/edit$/.exec(path);
  if (editMatch) return { page: "employee-edit", id: Number(editMatch[1]) };

  const detailMatch = /^\/employees\/([1-9]\d*)$/.exec(path);
  if (detailMatch)
    return { page: "employee-detail", id: Number(detailMatch[1]) };

  return { page: "not-found" };
}

function App() {
  // App menjadi pusat state aplikasi: route aktif, token sesi, dan user yang
  // sudah diverifikasi. Halaman anak menerima data/fungsi melalui props.
  const [route, setRoute] = useState<Route>(() =>
    matchRoute(window.location.pathname),
  );
  const token = useSyncExternalStore(subscribeSession, getSessionToken);
  const [verification, setVerification] = useState<Verification>({
    token: null,
    status: "ready",
    user: null,
  });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Saat browser back/forward ditekan, baca ulang URL lalu render halaman yang sesuai.
    const updateRoute = () => setRoute(matchRoute(window.location.pathname));
    window.addEventListener("popstate", updateRoute);
    return () => window.removeEventListener("popstate", updateRoute);
  }, []);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    // Token yang tersimpan harus diverifikasi ke backend. Hasil /me dipakai
    // untuk mengetahui user dan role sebelum halaman employee ditampilkan.
    getCurrentUser(controller.signal)
      .then((user) => setVerification({ token, status: "ready", user }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          clearSessionToken();
          return;
        }
        setVerification({
          token,
          status: "error",
          user: null,
          message:
            error instanceof Error
              ? error.message
              : "Akun tidak dapat diperiksa.",
        });
      });

    return () => controller.abort();
  }, [token, retryCount]);

  useEffect(() => {
    if (!token) return;
    const interval = window.setInterval(() => getUsableToken(), 15_000);
    return () => window.clearInterval(interval);
  }, [token]);

  const navigate = (to: string) => {
    // Navigasi internal tidak reload halaman. pushState mengubah URL, lalu
    // setRoute memberi tahu React agar komponen halaman berganti.
    const destination = new URL(to, window.location.origin);
    if (
      `${window.location.pathname}${window.location.search}` !==
      `${destination.pathname}${destination.search}`
    ) {
      window.history.pushState(null, "", to);
      setRoute(matchRoute(destination.pathname));
      window.scrollTo(0, 0);
    }
  };

  const onNavigate = (event: MouseEvent<HTMLAnchorElement>, to: string) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    navigate(to);
  };

  // LoginPage hanya bertanggung jawab atas UI form. App yang memiliki sesi dan
  // router, sehingga App menyediakan callback onLogin untuk mengirim kredensial,
  // menyimpan JWT, dan mengarahkan user setelah login berhasil.
  const onLogin = async (email: string, password: string) => {
    const accessToken = await login(email, password);
    try {
      saveSessionToken(accessToken);
    } catch {
      throw new Error("Sesi tidak dapat disimpan di browser ini.");
    }
    navigate(
      route.page === "login" || route.page === "not-found"
        ? "/employees"
        : window.location.pathname,
    );
  };

  const onLogout = () => {
    clearSessionToken();
    navigate("/login");
  };

  // Halaman login dipanggil dari App agar akses ke halaman terlindungi dapat
  // diputuskan sebelum halaman employee dirender. LoginPage tidak menyimpan JWT.
  if (route.page === "login" || (!token && route.page !== "not-found")) {
    return (
      <LoginPage
        onLogin={onLogin}
        authenticated={Boolean(token)}
        onNavigate={onNavigate}
      />
    );
  }

  if (token && verification.token !== token) {
    return (
      <div
        role="status"
        className="grid min-h-screen place-items-center bg-slate-50 px-4 text-sm text-slate-600"
      >
        Memeriksa sesi Anda...
      </div>
    );
  }

  if (token && verification.status === "error") {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Akun tidak dapat diperiksa
          </h1>
          <p role="alert" className="mt-3 text-sm text-slate-600">
            {verification.message}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Coba lagi
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Keluar
            </button>
          </div>
        </div>
      </main>
    );
  }

  const user = verification.user;
  const canEdit = user?.role === "admin";

  let content: ReactNode;

  // Setelah sesi terverifikasi, pilih halaman berdasarkan route aktif.
  // canEdit berasal dari role user dan dipakai untuk membatasi aksi admin.
  switch (route.page) {
    case "dashboard":
      content = <DashboardPage canEdit={canEdit} onNavigate={onNavigate} />;
      break;
    case "employees":
      content = <EmployeeListPage canEdit={canEdit} onNavigate={onNavigate} />;
      break;
    case "departments":
      content = <DepartmentPage canEdit={canEdit} />;
      break;
    case "audit-logs":
      content = canEdit ? (
        <AuditLogPage />
      ) : (
        <AccessDenied message="Akun Anda tidak memiliki akses untuk melihat audit log." />
      );
      break;
    case "employee-new":
      content = canEdit ? (
        <EmployeeFormPage mode="create" onNavigate={onNavigate} />
      ) : (
        <AccessDenied />
      );
      break;
    case "employee-detail":
      content = (
        <EmployeeDetailPage
          key={route.id}
          id={route.id}
          canEdit={canEdit}
          onNavigate={onNavigate}
        />
      );
      break;
    case "employee-edit":
      content = canEdit ? (
        <EmployeeFormPage
          key={route.id}
          mode="edit"
          id={route.id}
          onNavigate={onNavigate}
        />
      ) : (
        <AccessDenied />
      );
      break;
    default:
      content = (
        <NotFoundPage authenticated={Boolean(token)} onNavigate={onNavigate} />
      );
  }

  return (
    <LayoutAdmin
      activePage={route.page}
      user={user}
      onLogout={onLogout}
      onNavigate={onNavigate}
    >
      {content}
    </LayoutAdmin>
  );
}

function AccessDenied({
  message = "Akun Anda tidak memiliki akses untuk mengubah data employee.",
}: {
  message?: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Akses terbatas</h1>
      <p className="mt-3 text-sm text-slate-600">{message}</p>
    </section>
  );
}

export default App;
