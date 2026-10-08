import { useEffect, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
  Building2,
  LayoutDashboard,
  Menu,
  ScrollText,
  UsersRound,
  X,
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

type NavigationProps = {
  activePage: string;
  isAdmin: boolean;
  onNavigate: NavigateHandler;
};

export function LayoutAdmin({
  activePage,
  children,
  user,
  onLogout,
  onNavigate,
}: LayoutAdminProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const handleMobileNavigate = (
    event: MouseEvent<HTMLAnchorElement>,
    to: string,
  ) => {
    setMobileMenuOpen(false);
    onNavigate(event, to);
  };

  const handleMobileLogout = () => {
    setMobileMenuOpen(false);
    onLogout();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start lg:flex-col lg:overflow-y-auto">
          <Brand className="border-b border-slate-200 px-6 py-5" />
          <Navigation
            activePage={activePage}
            isAdmin={isAdmin}
            onNavigate={onNavigate}
          />
          <AccountPanel user={user} onLogout={onLogout} />
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white lg:hidden">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
              <AppLink
                to="/dashboard"
                onNavigate={onNavigate}
                aria-label="Buka dashboard"
                className="block w-full max-w-40"
              >
                <img
                  src="/logo-login.svg"
                  alt="Maspion Superstore"
                  className="h-auto w-full"
                />
              </AppLink>
              <button
                type="button"
                aria-label="Buka menu navigasi"
                aria-controls="mobile-sidebar"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(true)}
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                <Menu aria-hidden="true" className="size-5" />
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            {children}
          </main>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 transition-[visibility] lg:hidden ${mobileMenuOpen ? "visible" : "invisible delay-300"}`}
        aria-hidden={!mobileMenuOpen}
      >
        <button
          type="button"
          aria-label="Tutup menu navigasi"
          tabIndex={mobileMenuOpen ? 0 : -1}
          onClick={() => setMobileMenuOpen(false)}
          className={`absolute inset-0 bg-slate-950/40 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          id="mobile-sidebar"
          aria-label="Menu utama"
          className={`absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <Brand className="min-w-0 flex-1" />
            <button
              type="button"
              aria-label="Tutup menu navigasi"
              tabIndex={mobileMenuOpen ? 0 : -1}
              onClick={() => setMobileMenuOpen(false)}
              className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <Navigation
            activePage={activePage}
            isAdmin={isAdmin}
            onNavigate={handleMobileNavigate}
          />
          <AccountPanel user={user} onLogout={handleMobileLogout} />
        </aside>
      </div>
    </div>
  );
}

function Brand({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <img
        src="/logo-login.svg"
        alt="Maspion Superstore"
        className="h-auto w-full max-w-52"
      />
    </div>
  );
}

function Navigation({ activePage, isAdmin, onNavigate }: NavigationProps) {
  const employeeActive = activePage.startsWith("employee");
  const dashboardActive = activePage === "dashboard";
  const departmentActive = activePage === "departments";
  const auditActive = activePage === "audit-logs";
  const baseClass = "flex items-center gap-3 rounded-xl px-4 py-3 font-medium";
  const linkClass = (active: boolean) =>
    `${baseClass} ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`;

  return (
    <nav aria-label="Navigasi admin" className="flex-1 space-y-1 p-4 text-sm">
      <AppLink
        to="/dashboard"
        onNavigate={onNavigate}
        aria-current={dashboardActive ? "page" : undefined}
        className={linkClass(dashboardActive)}
      >
        <LayoutDashboard aria-hidden="true" className="size-4" /> Dashboard
      </AppLink>
      <AppLink
        to="/employees"
        onNavigate={onNavigate}
        aria-current={employeeActive ? "page" : undefined}
        className={linkClass(employeeActive)}
      >
        <UsersRound aria-hidden="true" className="size-4" /> Employee
      </AppLink>
      <AppLink
        to="/departments"
        onNavigate={onNavigate}
        aria-current={departmentActive ? "page" : undefined}
        className={linkClass(departmentActive)}
      >
        <Building2 aria-hidden="true" className="size-4" /> Department
      </AppLink>
      {isAdmin && (
        <AppLink
          to="/audit-logs"
          onNavigate={onNavigate}
          aria-current={auditActive ? "page" : undefined}
          className={linkClass(auditActive)}
        >
          <ScrollText aria-hidden="true" className="size-4" /> Audit log
        </AppLink>
      )}
    </nav>
  );
}

function AccountPanel({
  user,
  onLogout,
}: {
  user: AuthUser | null;
  onLogout: () => void;
}) {
  return (
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
  );
}
