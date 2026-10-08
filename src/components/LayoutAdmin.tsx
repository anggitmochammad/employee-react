import type { ReactNode } from "react";
import {
  Building2,
  LayoutDashboard,
  ScrollText,
  UsersRound,
} from "lucide-react";
import type { AuthUser } from "../auth/api";
import { AppLink } from "./AppLink";
import type { NavigateHandler } from "./AppLink";

type LayoutAdminProps = {
  activePage: string;
  children: ReactNode;
  user: AuthUser | null;
  onLogout: () => void;
  onNavigate: NavigateHandler;
};

// Layout utama setelah user berhasil login. Halaman employee dirender melalui
// children, sementara header, navigasi, informasi user, dan logout tetap sama.
export function LayoutAdmin({
  activePage,
  children,
  user,
  onLogout,
  onNavigate,
}: LayoutAdminProps) {
  const employeeActive = activePage.startsWith("employee");
  const dashboardActive = activePage === "dashboard";
  const departmentActive = activePage === "departments";
  const auditActive = activePage === "audit-logs";
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start lg:flex-col lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-5 font-semibold tracking-tight text-slate-950">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white"
            >
              E
            </span>
            <span>
              Employee
              <br />
              Management
            </span>
          </div>
          <nav
            aria-label="Navigasi admin"
            className="flex-1 space-y-1 p-4 text-sm"
          >
            <AppLink
              to="/dashboard"
              onNavigate={onNavigate}
              aria-current={dashboardActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium ${dashboardActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <LayoutDashboard aria-hidden="true" className="size-4" />{" "}
              Dashboard
            </AppLink>
            <AppLink
              to="/employees"
              onNavigate={onNavigate}
              aria-current={employeeActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium ${employeeActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <UsersRound aria-hidden="true" className="size-4" /> Employee
            </AppLink>
            <AppLink
              to="/departments"
              onNavigate={onNavigate}
              aria-current={departmentActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium ${departmentActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <Building2 aria-hidden="true" className="size-4" /> Department
            </AppLink>
            {isAdmin && (
              <AppLink
                to="/audit-logs"
                onNavigate={onNavigate}
                aria-current={auditActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium ${auditActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <ScrollText aria-hidden="true" className="size-4" /> Audit log
              </AppLink>
            )}
          </nav>
          <div className="border-t border-slate-200 p-4">
            <p className="truncate text-xs text-slate-500">
              {user?.email ?? "Akun aktif"}
            </p>
            <button
              type="button"
              onClick={onLogout}
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Keluar
            </button>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <AppLink
                to="/dashboard"
                onNavigate={onNavigate}
                className="flex items-center gap-3 font-semibold tracking-tight text-slate-950 lg:hidden"
              >
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white"
                >
                  E
                </span>
                <span>Employee Management</span>
              </AppLink>
              <div className="ml-auto flex items-center gap-2 text-sm lg:ml-0">
                <nav
                  aria-label="Navigasi mobile"
                  className="flex flex-wrap gap-1 lg:hidden"
                >
                  <AppLink
                    to="/dashboard"
                    onNavigate={onNavigate}
                    className={`rounded-lg px-2 py-2 font-medium ${dashboardActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}
                  >
                    Dashboard
                  </AppLink>
                  <AppLink
                    to="/employees"
                    onNavigate={onNavigate}
                    className={`rounded-lg px-2 py-2 font-medium ${employeeActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}
                  >
                    Employee
                  </AppLink>
                  <AppLink
                    to="/departments"
                    onNavigate={onNavigate}
                    aria-current={departmentActive ? "page" : undefined}
                    className={`rounded-lg px-2 py-2 font-medium ${departmentActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}
                  >
                    Department
                  </AppLink>
                  {isAdmin && (
                    <AppLink
                      to="/audit-logs"
                      onNavigate={onNavigate}
                      aria-current={auditActive ? "page" : undefined}
                      className={`rounded-lg px-2 py-2 font-medium ${auditActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}
                    >
                      Audit log
                    </AppLink>
                  )}
                </nav>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 lg:hidden"
                >
                  Keluar
                </button>
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
