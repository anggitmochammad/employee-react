import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { AppLink } from "../components/AppLink";
import type { NavigateHandler } from "../components/AppLink";
import { PageHeader } from "../components/PageHeader";
import { ApiError } from "../api/client";
import { getDepartments } from "../features/departments/api";
import {
  createEmployee,
  getEmployee,
  updateEmployee,
} from "../features/employees/api";
import { employeeRoutes } from "../features/employees/routes";
import type { Department } from "../types/employee";

type EmployeeFormPageProps = {
  mode: "create" | "edit";
  id?: number;
  onNavigate: NavigateHandler;
};
type FormState = {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  status: boolean;
};
const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  departmentId: "",
  status: true,
};

export function EmployeeFormPage({
  mode,
  id,
  onNavigate,
}: EmployeeFormPageProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [activeDepartmentIndex, setActiveDepartmentIndex] = useState(-1);
  const [departmentSearchStarted, setDepartmentSearchStarted] = useState(false);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [departmentError, setDepartmentError] = useState<string | null>(null);
  const [departmentRetry, setDepartmentRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const title = mode === "create" ? "Tambah employee" : "Ubah employee";
  const listHref = `${employeeRoutes.list}${window.location.search}`;

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getDepartments(controller.signal),
      mode === "edit" && id
        ? getEmployee(id, controller.signal)
        : Promise.resolve(null),
    ])
      .then(([departmentData, employee]) => {
        setDepartments(departmentData);
        setAllDepartments(departmentData);
        setLoadError(null);
        if (employee) {
          setSelectedDepartment(employee.department);
          setDepartmentSearch(employee.department.name);
          setForm({
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            departmentId: String(employee.departmentId),
            status: employee.status,
          });
        }
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError")
          return;
        setLoadError(
          cause instanceof Error ? cause.message : "Data form gagal dimuat.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, mode, retry]);

  useEffect(() => {
    if (!departmentSearchStarted) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => {
        getDepartments(controller.signal, departmentSearch.trim())
          .then((data) => {
            setDepartments(data);
            if (!departmentSearch.trim()) setAllDepartments(data);
            setActiveDepartmentIndex(data.length > 0 ? 0 : -1);
            setDepartmentError(null);
          })
          .catch((cause: unknown) => {
            if (cause instanceof DOMException && cause.name === "AbortError")
              return;
            setDepartmentError(
              cause instanceof Error
                ? cause.message
                : "Pilihan department gagal dimuat.",
            );
          })
          .finally(() => {
            if (!controller.signal.aborted) setDepartmentLoading(false);
          });
      },
      departmentSearch.trim() ? 350 : 0,
    );
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [departmentRetry, departmentSearch, departmentSearchStarted]);

  const retryLoad = () => {
    setLoading(true);
    setLoadError(null);
    setRetry((current) => current + 1);
  };

  const updateField = (field: keyof FormState, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }));

  const selectDepartment = (department: Department) => {
    updateField("departmentId", String(department.id));
    setSelectedDepartment(department);
    setDepartmentSearch(department.name);
    setDepartmentSearchStarted(false);
    setDepartmentLoading(false);
    setDepartmentError(null);
    setDepartments(allDepartments);
    setDepartmentOpen(false);
    setActiveDepartmentIndex(-1);
    setFieldErrors((current) => ({ ...current, departmentId: "" }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (!form.departmentId) {
      setFieldErrors({ departmentId: "Department wajib dipilih." });
      setError("Periksa field yang ditandai.");
      document.getElementById("employee-department")?.focus();
      return;
    }
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const input = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      departmentId: Number(form.departmentId),
      status: form.status,
    };
    try {
      const employee =
        mode === "create"
          ? await createEmployee(input)
          : await updateEmployee(id as number, input);
      const destination = `${employeeRoutes.detail(employee.id)}${window.location.search}`;
      window.history.pushState(
        {
          success:
            mode === "create"
              ? "Employee berhasil ditambahkan."
              : "Perubahan employee berhasil disimpan.",
        },
        "",
        destination,
      );
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo(0, 0);
    } catch (cause) {
      if (cause instanceof ApiError) {
        const validationErrors = mapValidationErrors(cause.details);
        setFieldErrors(validationErrors);
        setError(
          cause.details.length > 0
            ? Object.keys(validationErrors).length > 0
              ? "Periksa field yang ditandai."
              : cause.details.join(" ")
            : cause.message,
        );
        const firstField = ["name", "email", "phone", "departmentId"].find(
          (field) => validationErrors[field],
        );
        if (firstField)
          document
            .getElementById(
              `employee-${firstField === "departmentId" ? "department" : firstField}`,
            )
            ?.focus();
      } else setError("Employee gagal disimpan.");
    } finally {
      setSaving(false);
    }
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
        eyebrow="Data employee"
        title={title}
        description="Isi informasi employee untuk menyimpan profilnya."
      />
      {loading ? (
        <div
          role="status"
          className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm"
        >
          Memuat form...
        </div>
      ) : loadError ? (
        <section className="max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-rose-900">
            Form tidak tersedia
          </h2>
          <p role="alert" className="mt-2 text-sm text-rose-700">
            {loadError}
          </p>
          <button
            type="button"
            onClick={retryLoad}
            className="mt-4 min-h-10 cursor-pointer rounded-xl bg-white px-4 text-sm font-semibold text-rose-800 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-rose-600"
          >
            Coba lagi
          </button>
        </section>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="employee-name"
              label="Nama"
              value={form.name}
              error={fieldErrors.name}
              required
              onChange={(value) => updateField("name", value)}
            />
            <Field
              id="employee-email"
              label="Email"
              type="email"
              value={form.email}
              error={fieldErrors.email}
              required
              onChange={(value) => updateField("email", value)}
            />
            <Field
              id="employee-phone"
              label="Telepon"
              type="tel"
              value={form.phone}
              error={fieldErrors.phone}
              hint="Gunakan angka tanpa spasi atau tanda baca. Contoh: 081234567890 atau 6281234567890."
              required
              onChange={(value) => updateField("phone", value)}
            />
            <div className="block">
              <label
                htmlFor="employee-department"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Department
              </label>
              <div
                className="relative"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget))
                    setDepartmentOpen(false);
                }}
              >
                <input
                  id="employee-department"
                  type="text"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={departmentOpen}
                  aria-controls="employee-department-options"
                  aria-activedescendant={
                    departmentOpen && departments[activeDepartmentIndex]
                      ? `employee-department-option-${departments[activeDepartmentIndex].id}`
                      : undefined
                  }
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.departmentId)}
                  aria-describedby={
                    fieldErrors.departmentId
                      ? "employee-department-error"
                      : undefined
                  }
                  autoComplete="off"
                  value={departmentSearch}
                  onFocus={() => {
                    setDepartmentOpen(true);
                    setActiveDepartmentIndex(
                      Math.max(
                        0,
                        departments.findIndex(
                          (department) =>
                            department.id === selectedDepartment?.id,
                        ),
                      ),
                    );
                  }}
                  onClick={() => setDepartmentOpen(true)}
                  onChange={(event) => {
                    setDepartmentSearch(event.target.value);
                    setSelectedDepartment(null);
                    updateField("departmentId", "");
                    setDepartmentSearchStarted(true);
                    setDepartmentLoading(true);
                    setDepartmentError(null);
                    setDepartmentOpen(true);
                    setActiveDepartmentIndex(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                      event.preventDefault();
                      setDepartmentOpen(true);
                      setActiveDepartmentIndex((current) =>
                        departments.length === 0
                          ? -1
                          : event.key === "ArrowDown"
                            ? (current + 1) % departments.length
                            : (current - 1 + departments.length) %
                              departments.length,
                      );
                    } else if (event.key === "Enter" && departmentOpen) {
                      event.preventDefault();
                      const department = departments[activeDepartmentIndex];
                      if (department && !departmentLoading)
                        selectDepartment(department);
                    } else if (event.key === "Escape" && departmentOpen) {
                      event.preventDefault();
                      setDepartmentOpen(false);
                    }
                  }}
                  placeholder="Cari atau pilih department"
                  className={`min-h-11 w-full rounded-xl border bg-white px-3 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${fieldErrors.departmentId ? "border-rose-400" : "border-slate-300"}`}
                />
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-3 size-5 text-slate-500"
                />
                {departmentOpen && (
                  <div
                    id="employee-department-options"
                    role="listbox"
                    aria-label="Pilihan department"
                    className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    {departmentLoading ? (
                      <p
                        role="status"
                        className="px-3 py-2 text-sm text-slate-500"
                      >
                        Mencari department...
                      </p>
                    ) : departments.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-500">
                        Tidak ada department ditemukan.
                      </p>
                    ) : (
                      departments.map((department, index) => (
                        <button
                          key={department.id}
                          id={`employee-department-option-${department.id}`}
                          type="button"
                          role="option"
                          aria-selected={
                            form.departmentId === String(department.id)
                          }
                          onMouseEnter={() => setActiveDepartmentIndex(index)}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectDepartment(department)}
                          className={`block w-full cursor-pointer px-3 py-2 text-left text-sm ${index === activeDepartmentIndex ? "bg-indigo-50 text-indigo-800" : "text-slate-700 hover:bg-slate-50"}`}
                        >
                          {department.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {departmentError && (
                <p className="mt-1 text-xs text-rose-700">
                  {departmentError}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setDepartmentLoading(true);
                      setDepartmentError(null);
                      setDepartmentOpen(true);
                      setDepartmentRetry((current) => current + 1);
                    }}
                    className="cursor-pointer font-semibold underline"
                  >
                    Coba lagi
                  </button>
                </p>
              )}
              {fieldErrors.departmentId && (
                <p
                  id="employee-department-error"
                  className="mt-1 text-sm text-rose-700"
                >
                  {fieldErrors.departmentId}
                </p>
              )}
            </div>
          </div>
          <label className="mt-5 flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.status}
              onChange={(event) => updateField("status", event.target.checked)}
              className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />{" "}
            Employee aktif
          </label>
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {error}
            </p>
          )}
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <AppLink
              to={listHref}
              onNavigate={onNavigate}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </AppLink>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan employee"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  required,
  error,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  required?: boolean;
  error?: string;
  hint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        id={id}
        type={type}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
            .filter(Boolean)
            .join(" ") || undefined
        }
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${error ? "border-rose-400" : "border-slate-300"}`}
      />
      {hint && (
        <p
          id={`${id}-hint`}
          className="mt-1.5 text-xs leading-5 text-slate-500"
        >
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-rose-700">
          {error}
        </p>
      )}
    </label>
  );
}

function mapValidationErrors(errors: string[]): Record<string, string> {
  const fields: Record<string, string> = {};
  errors.forEach((message) => {
    const field = [
      "name",
      "email",
      "phone",
      "departmentId",
      "department",
      "status",
    ].find((candidate) =>
      message.toLowerCase().includes(candidate.toLowerCase()),
    );
    if (field)
      fields[field === "department" ? "departmentId" : field] = message;
  });
  return fields;
}
